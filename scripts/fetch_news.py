"""
PausKIT daily content job (runs on GitHub Actions just before midnight Spain time, see .github/workflows/daily.yml)

Each day gets ONE new story, never repeated:
  - the day is the calendar day in Spain (Europe/Madrid); a run after 14:00 prepares tomorrow,
    so the new story is live at 00:00 Spain time
  - topics rotate (Longevity, Climate, AI & Tech, Demographics, Mind & Brain, Space, Health, Science)
    so the same kind of story doesn't come back for several days
  - a story is skipped if its link OR its subject (similar headline) was used in the last 60 days,
    so the same research reported by two outlets can't appear twice

1. Collects recent stories from good-news outlets AND science / health / tech news sources.
2. Filters for the kind of news PausKIT wants first thing in the morning:
   discoveries, research breakthroughs, AI for good, health, helpful technology,
   and people improving life for their communities. Skips personal feats, celebrities,
   cute-animal stories, politics and anything negative.
3. Asks a free AI model (Cloudflare Workers AI) to pick ONE story
   and retell it in warm, plain language, plus what it means for us.
   Accuracy guard: the model only sees the article's own text, and any number in its
   answer that doesn't appear in that text gets the answer rejected.
4. Saves one story per day in news.json (keeps the last 60 days), plus "On this day".
Only uses the Python standard library. If anything fails, the previous news.json is kept.
"""
import json, re, html, os, sys, datetime as dt, urllib.request, urllib.error, email.utils
import xml.etree.ElementTree as ET

FEEDS = [
    # Good-news outlets
    ("Reasons to be Cheerful", "https://reasonstobecheerful.world/feed/"),
    ("The Guardian · The Upside", "https://www.theguardian.com/world/series/the-upside/rss"),
    ("Good News Network", "https://www.goodnewsnetwork.org/category/news/science/feed/"),
    ("Good News Network", "https://www.goodnewsnetwork.org/category/news/health/feed/"),
    ("Good News Network", "https://www.goodnewsnetwork.org/category/news/earth/feed/"),
    ("Good Good Good", "https://www.goodgoodgood.co/articles/rss.xml"),
    # Science, health and technology news
    ("ScienceDaily", "https://www.sciencedaily.com/rss/top/science.xml"),
    ("ScienceDaily", "https://www.sciencedaily.com/rss/top/health.xml"),
    ("ScienceDaily", "https://www.sciencedaily.com/rss/top/technology.xml"),
    ("Phys.org", "https://phys.org/rss-feed/breaking/"),
    ("Medical Xpress", "https://medicalxpress.com/rss-feed/breaking/"),
    ("Tech Xplore", "https://techxplore.com/rss-feed/breaking/"),
    ("MIT News", "https://news.mit.edu/rss/research"),
    ("NASA", "https://www.nasa.gov/news-release/feed/"),
    # Longevity and ageing
    ("ScienceDaily", "https://www.sciencedaily.com/rss/health_medicine/healthy_aging.xml"),
    ("ScienceDaily", "https://www.sciencedaily.com/rss/mind_brain/memory.xml"),
    ("Medical Xpress", "https://medicalxpress.com/rss-feed/gerontology-geriatrics-news/"),
    # Climate and energy
    ("ScienceDaily", "https://www.sciencedaily.com/rss/earth_climate/climate.xml"),
    ("Phys.org", "https://phys.org/rss-feed/earth-news/"),
    ("Carbon Brief", "https://www.carbonbrief.org/feed"),
    # Demographics and how we live
    ("Our World in Data", "https://ourworldindata.org/atom.xml"),
    ("Pew Research Center", "https://www.pewresearch.org/feed/"),
    ("Phys.org", "https://phys.org/rss-feed/science-news/social-sciences/"),
    # Mind, brain and consciousness
    ("ScienceDaily", "https://www.sciencedaily.com/rss/mind_brain.xml"),
    # Space
    ("ScienceDaily", "https://www.sciencedaily.com/rss/space_time.xml"),
    ("Phys.org", "https://phys.org/rss-feed/space-news/"),
    # Technology
    ("MIT Technology Review", "https://www.technologyreview.com/feed/"),
]

# Topics, in the order they are checked (first match wins), and the daily rotation
CATEGORIES = [
    ("Longevity", r"longevity|ageing|aging|lifespan|healthspan|senescen|rejuvenat|older adults|elderly|age-related|centenarian|telomer|live longer|biological age|dementia|alzheimer"),
    ("Mind & Brain", r"\bbrain|neuro|conscious|memory|memories|\bsleep|meditat|mental health|cognit|dream|emotion|mindful"),
    ("Space", r"nasa|\besa\b|telescope|galax|planet|asteroid|comet|\bmoon|\bmars\b|\bstars?\b|cosmic|universe|astronom|black hole|spacecraft|orbit"),
    ("Climate", r"climate|carbon|emission|renewable|solar|wind (power|farm|energy|turbine)|heat ?wave|warming|decarbon|net zero|electric (car|vehicle)|heat pump|reforest|coral|ocean|glacier|biodiversity|clean energy"),
    ("Demographics", r"population|demograph|birth ?rate|fertility rate|life expectancy|migra|census|generation|urbani[sz]|households?|literacy|poverty|inequalit|workforce|young people|survey of|americans|europeans|countries"),
    ("AI & Tech", r"\bai\b|artificial intelligence|machine learning|robot|quantum|\bchips?\b|computer|software|algorithm|engineer|device|sensor|3d[- ]print|technolog"),
    ("Health", r"health|patient|disease|cancer|vaccine|drug|therapy|treatment|medic|hospital|clinical|gut\b|heart"),
    ("Science", r"."),
]
ROTATION = ["Longevity", "Climate", "AI & Tech", "Demographics", "Mind & Brain", "Space", "Health"]  # "Science" = last resort only
SPECIALIST = {"Carbon Brief", "Our World in Data", "Pew Research Center", "MIT Technology Review"}
STOP = set("about after again against among because before being between could during every first from have into just more most much other over said says some such than that their them there these they this those through under very what when where which while with would your study studies research researchers scientists found finds shows show reveals reveal suggests suggest helps help could might people world years year".split())

POSITIVE = r"breakthrough|discover|first[- ]ever|for the first time|new (treatment|therapy|drug|vaccine|test|method|material|way)|vaccine|cure|approved|restor|regrow|repair|reverse|detect(s|ed)? early|early detection|clean energy|renewable|solar|battery|recycl|carbon capture|desalinat|ai\b|artificial intelligence|machine learning|robot|telescope|nasa|species (found|discovered)|protect|recover|rebound|record low|fall(s|en)? to|drops? to|cuts?\b|reduc|improv|boost|help(s|ed|ing)?\b|community|villag|neighbo|cooperative|free (school|meals|care|housing)|access|affordable"
NEGATIVE = r"\b(death|deaths|dies|died|dead|kill|killed|war|attack|crisis|threat|warn|danger|decline|worse|worst|fear|collapse|toxic|poison|shooting|linked to (higher|increased)|fails?|failure|lawsuit|scandal|layoff|shortage|outbreak|pandemic|disaster|fraud|hack|breach)\b"
PERSONAL_FEAT = r"\b\d{1,3}-year-old\b|years? old\b|marathon|wheelchair|birthday|grandm|grandf|graduat|wedding|propos|puppy|kitten|dog\b|cat\b|celebrit|singer|actor|actress|surpris|reunit|lottery|record[- ]breaking (walk|swim|run)|walk(ed)? around the world|quote of the day|good news in history"

UA = {"User-Agent": "PauseDailyBot/2.0 (+https://pauskit.com/)"}
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "news.json")

MODEL = os.environ.get("PAUSE_MODEL", "openai/gpt-4o-mini")


def get(url, timeout=25, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def clean(text, limit=None):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"(The post .* appeared first on .*|Continue reading.*|Read more.*)$", "", text).strip()
    if limit and len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return text


def parse_date(s):
    try:
        d = email.utils.parsedate_to_datetime(s)
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except Exception:
        try:
            return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None


def items_from(xml_bytes):
    root = ET.fromstring(xml_bytes)
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for it in root.iter("item"):
        yield it.findtext("title"), it.findtext("link"), it.findtext("pubDate"), it.findtext("description"), " ".join(c.text or "" for c in it.findall("category"))
    for it in root.iter("{http://www.w3.org/2005/Atom}entry"):
        link = it.find("a:link", ns)
        yield it.findtext("a:title", namespaces=ns), link.get("href") if link is not None else "", it.findtext("a:updated", namespaces=ns), it.findtext("a:summary", namespaces=ns), ""


def article_text(url, limit=2500):
    """First paragraphs of the article, to give the writer real facts to work from."""
    try:
        page = get(url, timeout=20).decode("utf-8", "ignore")
    except Exception:
        return ""
    meta = re.search(r'<meta[^>]+(?:name|property)="(?:og:)?description"[^>]+content="([^"]+)"', page, re.I)
    paras = [clean(p) for p in re.findall(r"<p[^>]*>(.*?)</p>", page, re.I | re.S)]
    paras = [p for p in paras if len(p) > 80 and not re.search(r"cookie|subscribe|newsletter|all rights reserved|©", p, re.I)]
    text = " ".join(([clean(meta.group(1))] if meta else []) + paras)
    return text[:limit]


from zoneinfo import ZoneInfo
now = dt.datetime.now(dt.timezone.utc)
madrid = now.astimezone(ZoneInfo("Europe/Madrid"))
# From 14:00 in Spain we prepare TOMORROW's page, so it's ready at midnight even when GitHub
# starts the run late. Before 14:00 we only fill in today if it's still missing.
target = (madrid + dt.timedelta(days=1)).date() if madrid.hour >= 14 else madrid.date()
today = target.isoformat()
FORCE = os.environ.get("FORCE", "") == "1"
print(f"Spain time {madrid:%Y-%m-%d %H:%M} -> preparing {today}")

try:
    old = json.load(open(OUT))
except Exception:
    old = {}
days = old.get("days", {}) if isinstance(old.get("days"), dict) else {}
if days.get(today, {}).get("written_by") == "ai" and not FORCE:
    print(f"{today} already has its story; nothing to do.")
    sys.exit(0)

errors, candidates, seen, feed_counts = [], [], set(), {}


def words(t):
    return {w for w in re.findall(r"[a-z]{4,}", (t or "").lower()) if w not in STOP}


def similar(a, b):
    A, B = words(a), words(b)
    if not A or not B:
        return False
    common = len(A & B)
    return common >= 3 and common / min(len(A), len(B)) >= 0.5


def category(blob):
    return next(c for c, p in CATEGORIES if re.search(p, blob, re.I))

for source, url in FEEDS:
    try:
        n_feed = 0
        for title, link, date_s, desc, cats in items_from(get(url)):
            title, link = clean(title, 200), (link or "").strip()
            date = parse_date(date_s or "")
            max_age = 10 if source in SPECIALIST else 4
            if not title or not link.startswith("http") or not date or (now - date).days > max_age:
                continue
            n_feed += 1
            key = re.sub(r"\W+", "", title.lower())[:60]
            if key in seen:
                continue
            seen.add(key)
            summary = clean(desc, 600)
            blob = f"{title} {summary} {cats}"
            if re.search(NEGATIVE, title, re.I) or re.search(PERSONAL_FEAT, blob, re.I):
                continue
            score = len(re.findall(POSITIVE, blob, re.I)) + (1 if source in ("Positive News", "Reasons to be Cheerful", "The Guardian · The Upside", "Good Good Good") else 0)
            cat = category(f"{title} {summary}")
            if score == 0 and source not in SPECIALIST and cat not in ("Longevity", "Mind & Brain", "Space", "Demographics"):
                continue
            candidates.append({"title": title, "summary": summary, "link": link, "source": source, "date": date.date().isoformat(), "score": score, "cat": cat})
        feed_counts[url] = n_feed
    except Exception as e:
        feed_counts[url] = f"failed: {type(e).__name__}"
        errors.append(f"{source}: {type(e).__name__}: {e}"[:200])

# Never repeat: drop anything whose link or subject was used in the last 60 days...
past = [d for k, d in days.items() if k != today]
used_links = {d.get("link") for d in past}
used_titles = [t for d in past for t in (d.get("src_title"), d.get("headline")) if t]
candidates = [c for c in candidates if c["link"] not in used_links and not any(similar(c["title"], t) for t in used_titles)]
# ...and keep only one version of a story covered by several outlets today
candidates.sort(key=lambda c: (c["score"], c["date"]), reverse=True)
unique = []
for c in candidates:
    if not any(similar(c["title"], u["title"]) for u in unique):
        unique.append(c)
candidates = unique

# Topic rotation: start from today's place in the rotation and skip topics used in the last 4 days
recent_topics = [days[k].get("topic") for k in sorted(k for k in days if k < today)[-4:]]
n_day = target.toordinal()
rotation = ROTATION[n_day % len(ROTATION):] + ROTATION[:n_day % len(ROTATION)]
preferred = [t for t in rotation if t not in recent_topics] + [t for t in rotation if t in recent_topics] + ["Science"]
by_cat = {t: [c for c in candidates if c["cat"] == t] for t in preferred}
chosen_cat = next((t for t in preferred if by_cat[t]), None)
shortlist = (by_cat[chosen_cat][:12] if chosen_cat else [])
n_main = len(shortlist)  # the AI chooses only among these; the rest are backups
# backups from the next topics, in case the writer can't use any story in the chosen one
for t in preferred:
    if t != chosen_cat and len(shortlist) < 18:
        shortlist += by_cat[t][:2]
print(f"recent topics {recent_topics} -> today's topic: {chosen_cat}")


def numbers(s):
    return set(re.findall(r"\d[\d,.]*", s or ""))


def ask_model(shortlist):
    listing = "\n".join(f"[{i}] ({c['source']}) {c['title']} — {c['summary'][:300]}" for i, c in enumerate(shortlist))
    prompt = f"""You choose the single best "good news" story for PausKIT, a calm daily diary app people read with their morning coffee.

Today's topic is "{chosen_cat}".
Pick the ONE story that is the most fascinating, hopeful and surprising to a curious adult: a real discovery or research result, longevity and healthy-ageing science, technology or AI helping people, climate and energy progress that works, how populations and ways of living are changing, the brain and consciousness, or space.
Do NOT pick: personal feats or human-interest stories about one individual, celebrities, cute animals, sport, politics, anything sad, scary or uncertain.

Stories:
{listing}

Reply with JSON only: {{"pick": <number>, "backup": <number>}}"""
    choice = call_model(prompt, max_tokens=60)
    m = re.search(r"\{.*\}", choice or "", re.S)
    return json.loads(m.group(0)) if m else None


def write_story(c, body):
    source_text = f"{c['title']}\n{c['summary']}\n{body}"
    prompt = f"""Retell this news story for PausKIT, a warm daily diary app. Write for a curious adult with no science background, reading on their phone with a coffee.

Rules:
- Use ONLY facts stated in the source text below. Never add names, numbers, dates, places or claims that are not in it.
- Write in your own words; do not copy sentences.
- Be honest about uncertainty: if it's early research, say so (for example "in early tests").
- No hype words like "miracle" or "revolutionary".

Return JSON only:
{{"headline": "a clear, friendly headline, max 12 words",
  "story": "3 to 4 short sentences telling what happened, like you're telling a friend",
  "why": "1 to 2 sentences on what this could mean for us as humans, in everyday terms"}}

Source text:
{source_text[:3500]}"""
    out = call_model(prompt, max_tokens=450)
    m = re.search(r"\{.*\}", out or "", re.S)
    if not m:
        return None
    data = json.loads(m.group(0))
    if not all(isinstance(data.get(k), str) and data[k].strip() for k in ("headline", "story", "why")):
        return None
    allowed = numbers(source_text)
    for k in ("headline", "story", "why"):
        for n in numbers(data[k]):
            if n.strip(".,") not in {a.strip(".,") for a in allowed}:
                raise ValueError(f"number '{n}' not in source")
    return {k: data[k].strip() for k in ("headline", "story", "why")}


# GitHub Models was retired on 30 July 2026, so the writer now uses Cloudflare Workers AI (free daily allowance).
CF_ACCOUNT = os.environ.get("CF_ACCOUNT_ID", "").strip()
CF_TOKEN = os.environ.get("CF_API_TOKEN", "").strip()
CF_MODELS = [os.environ.get("PAUSE_MODEL") or "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct"]
GOOD = []  # remembers the model that worked


def call_model(prompt, max_tokens):
    """Ask Cloudflare Workers AI. Returns None when no token is set (the page then shows the source's own words)."""
    if not (CF_ACCOUNT and CF_TOKEN):
        return None
    problems = []
    for model in (GOOD or CF_MODELS):
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT}/ai/run/{model}"
        body = json.dumps({"max_tokens": max_tokens, "temperature": 0.4,
                           "messages": [{"role": "system", "content": "You are a careful science and good-news writer. You never invent facts."},
                                        {"role": "user", "content": prompt}]}).encode()
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "Authorization": f"Bearer {CF_TOKEN}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                raw = r.read().decode("utf-8", "ignore")
        except urllib.error.HTTPError as e:
            problems.append(f"{model} HTTP {e.code}: {e.read().decode('utf-8', 'ignore')[:150]}")
            continue
        except Exception as e:
            problems.append(f"{model}: {e}")
            continue
        try:
            res = json.loads(raw)["result"]["response"]
            text = res if isinstance(res, str) else json.dumps(res)
            if not GOOD:
                GOOD.append(model); print("model OK:", model)
            return text
        except Exception:
            problems.append(f"{model} unexpected reply: {raw[:150]!r}")
    raise RuntimeError(" | ".join(problems))


TOPIC_GUESS = [("Health", r"health|patient|disease|cancer|vaccine|drug|therapy|brain|medic|hospital"),
               ("AI & Tech", r"\bai\b|artificial intelligence|robot|battery|software|chip|quantum|engineer"),
               ("Planet", r"climate|carbon|solar|wind|forest|ocean|reef|species|wildlife|energy|recycl"),
               ("Community", r"communit|village|city|neighbo|school|residents|volunteer"),
               ("Science", r".")]

story = None
if shortlist:
    order = list(range(len(shortlist)))
    topic = None
    try:
        choice = ask_model(shortlist[:n_main] or shortlist)
        if choice and isinstance(choice.get("pick"), int):
            first = [choice["pick"]] + ([choice["backup"]] if isinstance(choice.get("backup"), int) else [])
            order = [i for i in first if 0 <= i < (n_main or len(shortlist))] + [i for i in order if i not in first]
    except Exception as e:
        errors.append(f"model pick: {e}"[:200])
    for i in order[:8]:
        c = shortlist[i]
        try:
            written = write_story(c, article_text(c["link"])) if CF_TOKEN else None
        except Exception as e:
            errors.append(f"model write: {e}"[:200]); written = None
        if written:
            story = {**written, "topic": c["cat"], "src_title": c["title"],
                     "source": c["source"], "link": c["link"], "published": c["date"], "written_by": "ai"}
            break
    if not story:  # no AI available: use the outlet's own headline and summary
        c = shortlist[order[0]]
        story = {"headline": c["title"], "story": clean(c["summary"], 400), "why": "", "topic": c["cat"], "src_title": c["title"],
                 "source": c["source"], "link": c["link"], "published": c["date"], "written_by": "source"}

if story:
    days[today] = story
days = dict(sorted(days.items())[-60:])

# Word of the day: one word inspired by the day's good news (it also picks the day's theme for thoughts and prompts)
THEMES = ["Time", "The Body", "Home", "Laughter", "Calm", "Change", "Small Wonders", "Stories", "Fear", "Kindness",
          "Curiosity", "Nature", "The Self", "Rest", "Beginnings"]
FALLBACK_WORD = {"Health": ("Healing", "The Body"), "AI & Tech": ("Ingenuity", "Curiosity"), "Planet": ("Renewal", "Nature"),
                 "Community": ("Together", "Kindness"), "Science": ("Wonder", "Small Wonders"),
                 "Longevity": ("Vitality", "Time"), "Climate": ("Renewal", "Nature"), "Demographics": ("Belonging", "Home"),
                 "Mind & Brain": ("Awareness", "The Self"), "Space": ("Wonder", "Curiosity")}


def word_of_day(st, recent):
    prompt = f"""Choose the Word of the Day for PausKIT, a calm daily diary app. It must be inspired by today's good news story below.

Rules:
- One single, short (max 10 letters), simple, gentle and uplifting English word a 10-year-old understands (for example: Renewal, Patience, Together, Wonder, Courage, Healing, Belonging, Hope, Care). Never words about power, control, winning or money.
- Avoid repeating these recent words: {", ".join(recent) or "none"}.
- "meaning": one warm sentence (max 22 words) speaking to the reader: link the word to the story, then to their own day (for example "Like enamel that can grow back, small repairs add up. What could you mend today?"). Use only facts from the story; no numbers.
- "theme": the closest match from this exact list: {", ".join(THEMES)}.

Return JSON only: {{"word": "...", "meaning": "...", "theme": "..."}}

Today's good news:
{st.get("headline", "")}. {st.get("story", "")} {st.get("why", "")}"""
    out = call_model(prompt, max_tokens=160)
    m = re.search(r"\{.*\}", out or "", re.S)
    if not m:
        return None
    d = json.loads(m.group(0))
    w = str(d.get("word", "")).strip().strip(".").split()[0].capitalize() if d.get("word") else ""
    mean = str(d.get("meaning", "")).strip()
    th = d.get("theme") if d.get("theme") in THEMES else None
    if not w or not w.isalpha() or len(w) > 10 or w.lower() in {"control", "power", "stewardship"} or not mean or numbers(mean):
        return None
    return {"word": w, "meaning": mean, "theme": th or FALLBACK_WORD.get(st.get("topic"), ("", "Small Wonders"))[1], "by": "ai"}


recent_words = []
for d in [k for k in sorted(days) if k <= today][-8:]:
    st = days[d]
    if st.get("word") and not (d == today and st["word"].get("by") != "ai"):
        recent_words.append(st["word"]["word"]); continue
    wd = None
    if CF_TOKEN:
        try:
            wd = word_of_day(st, recent_words)
        except Exception as e:
            errors.append(f"word: {e}"[:200])
    if not wd:
        w, th = FALLBACK_WORD.get(st.get("topic"), ("Wonder", "Small Wonders"))
        wd = {"word": w, "meaning": f"Inspired by today's good news: {st.get('headline', '')}", "theme": th, "by": "fallback"}
    st["word"] = wd
    recent_words.append(wd["word"])

# On this day in history (Wikipedia), keeping only uplifting events
on_this_day = None
try:
    data = json.loads(get(f"https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/{target:%m}/{target:%d}"))
    DARK = r"kill|war\b|wars\b|attack|bomb|murder|massacre|assassin|terror|strike|died|death|dead|shoot|crash|disaster|genocide|execut|invasion|invade|riot|explosion|hostage|militant|coup|nazi|holocaust|earthquake|famine|sank|sinking|guillotin|uprising|occupation|military|battle|slave|plague|epidemic|hanged|prison"
    events = []
    for ev in [e for e in data.get("selected", []) if not re.search(DARK, e.get("text", ""), re.I)][:12]:
        page = (ev.get("pages") or [{}])[0]
        events.append({"year": ev.get("year"), "text": clean(ev.get("text"), 220), "link": page.get("content_urls", {}).get("desktop", {}).get("page", "")})
    if events:
        on_this_day = {"date": target.strftime("%m-%d"), "events": events}
except Exception as e:
    errors.append(f"Wikipedia: {e}"[:200])

# On this day is saved with its own date, so preparing tomorrow never removes today's
if on_this_day and today in days:
    days[today]["otd"] = on_this_day

out = {
    "updated": now.isoformat(timespec="minutes"),
    "days": days,
    "onThisDay": on_this_day or old.get("onThisDay"),
    "prepared_for": today,
    "candidates_today": len(candidates),
    "feeds": feed_counts,
    "errors": errors,
}
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(f"today: {days.get(today, {}).get('headline')!r} ({days.get(today, {}).get('written_by')}) · {len(candidates)} candidates · errors: {errors}")

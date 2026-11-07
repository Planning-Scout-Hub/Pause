"""
PausKIT daily content job (runs every morning on GitHub Actions, see .github/workflows/daily.yml)

1. Collects recent stories from good-news outlets AND science / health / tech news sources.
2. Filters for the kind of news PausKIT wants first thing in the morning:
   discoveries, research breakthroughs, AI for good, health, helpful technology,
   and people improving life for their communities. Skips personal feats, celebrities,
   cute-animal stories, politics and anything negative.
3. Asks a free AI model (GitHub Models, via the workflow's own token) to pick ONE story
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
    ("Positive News", "https://www.positive.news/feed/"),
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
]

POSITIVE = r"breakthrough|discover|first[- ]ever|for the first time|new (treatment|therapy|drug|vaccine|test|method|material|way)|vaccine|cure|approved|restor|regrow|repair|reverse|detect(s|ed)? early|early detection|clean energy|renewable|solar|battery|recycl|carbon capture|desalinat|ai\b|artificial intelligence|machine learning|robot|telescope|nasa|species (found|discovered)|protect|recover|rebound|record low|fall(s|en)? to|drops? to|cuts?\b|reduc|improv|boost|help(s|ed|ing)?\b|community|villag|neighbo|cooperative|free (school|meals|care|housing)|access|affordable"
NEGATIVE = r"\b(death|deaths|dies|died|dead|kill|killed|war|attack|crisis|threat|warn|danger|decline|worse|worst|fear|collapse|toxic|poison|shooting|linked to (higher|increased)|fails?|failure|lawsuit|scandal|layoff|shortage|outbreak|pandemic|disaster|fraud|hack|breach)\b"
PERSONAL_FEAT = r"\b\d{1,3}-year-old\b|years? old\b|marathon|wheelchair|birthday|grandm|grandf|graduat|wedding|propos|puppy|kitten|dog\b|cat\b|celebrit|singer|actor|actress|surpris|reunit|lottery|record[- ]breaking (walk|swim|run)|walk(ed)? around the world|quote of the day|good news in history"

UA = {"User-Agent": "PauseDailyBot/2.0 (+https://planning-scout-hub.github.io/Pause/)"}
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


now = dt.datetime.now(dt.timezone.utc)
today = now.date().isoformat()
errors, candidates, seen = [], [], set()

for source, url in FEEDS:
    try:
        for title, link, date_s, desc, cats in items_from(get(url)):
            title, link = clean(title, 200), (link or "").strip()
            date = parse_date(date_s or "")
            if not title or not link.startswith("http") or not date or (now - date).days > 4:
                continue
            key = re.sub(r"\W+", "", title.lower())[:60]
            if key in seen:
                continue
            seen.add(key)
            summary = clean(desc, 600)
            blob = f"{title} {summary} {cats}"
            if re.search(NEGATIVE, title, re.I) or re.search(PERSONAL_FEAT, blob, re.I):
                continue
            score = len(re.findall(POSITIVE, blob, re.I)) + (1 if source in ("Positive News", "Reasons to be Cheerful", "The Guardian · The Upside", "Good Good Good") else 0)
            if score == 0:
                continue
            candidates.append({"title": title, "summary": summary, "link": link, "source": source, "date": date.date().isoformat(), "score": score})
    except Exception as e:
        errors.append(f"{source}: {type(e).__name__}: {e}"[:200])

try:
    old = json.load(open(OUT))
except Exception:
    old = {}
days = old.get("days", {}) if isinstance(old.get("days"), dict) else {}
used_links = {d.get("link") for k, d in days.items() if k != today}
candidates = [c for c in candidates if c["link"] not in used_links]
candidates.sort(key=lambda c: (c["score"], c["date"]), reverse=True)
shortlist = candidates[:25]


def numbers(s):
    return set(re.findall(r"\d[\d,.]*", s or ""))


def ask_model(shortlist):
    listing = "\n".join(f"[{i}] ({c['source']}) {c['title']} — {c['summary'][:300]}" for i, c in enumerate(shortlist))
    prompt = f"""You choose the single best "good news" story for PausKIT, a calm daily diary app people read with their morning coffee.

Pick ONE story that is about: a scientific discovery or research breakthrough, AI or technology helping people, a health or medical advance, a clean-energy or environmental solution that works, or people/communities finding ways to live better together.
Do NOT pick: personal feats or human-interest stories about one individual, celebrities, cute animals, sport, politics, anything sad, scary or uncertain.

Stories:
{listing}

Reply with JSON only: {{"pick": <number>, "backup": <number>, "topic": "Science|Health|AI & Tech|Planet|Community"}}"""
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
        choice = ask_model(shortlist)
        if choice and isinstance(choice.get("pick"), int):
            first = [choice["pick"]] + ([choice["backup"]] if isinstance(choice.get("backup"), int) else [])
            order = [i for i in first if 0 <= i < len(shortlist)] + [i for i in order if i not in first]
            topic = choice.get("topic")
    except Exception as e:
        errors.append(f"model pick: {e}"[:200])
    for i in order[:4]:
        c = shortlist[i]
        try:
            written = write_story(c, article_text(c["link"])) if CF_TOKEN else None
        except Exception as e:
            errors.append(f"model write: {e}"[:200]); written = None
        if written:
            guess = next(t for t, p in TOPIC_GUESS if re.search(p, c["title"] + " " + c["summary"], re.I))
            story = {**written, "topic": topic if (topic and i == order[0]) else guess,
                     "source": c["source"], "link": c["link"], "published": c["date"], "written_by": "ai"}
            break
    if not story:  # no AI available: use the outlet's own headline and summary
        c = shortlist[order[0]]
        guess = next(t for t, p in TOPIC_GUESS if re.search(p, c["title"] + " " + c["summary"], re.I))
        story = {"headline": c["title"], "story": clean(c["summary"], 400), "why": "", "topic": guess,
                 "source": c["source"], "link": c["link"], "published": c["date"], "written_by": "source"}

if story:
    days[today] = story
days = dict(sorted(days.items())[-60:])

# Word of the day: one word inspired by the day's good news (it also picks the day's theme for thoughts and prompts)
THEMES = ["Time", "The Body", "Home", "Laughter", "Calm", "Change", "Small Wonders", "Stories", "Fear", "Kindness",
          "Curiosity", "Nature", "The Self", "Rest", "Beginnings"]
FALLBACK_WORD = {"Health": ("Healing", "The Body"), "AI & Tech": ("Ingenuity", "Curiosity"), "Planet": ("Renewal", "Nature"),
                 "Community": ("Together", "Kindness"), "Science": ("Wonder", "Small Wonders")}


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
for d in sorted(days)[-8:]:
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
    data = json.loads(get(f"https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/{now:%m}/{now:%d}"))
    DARK = r"kill|war\b|wars\b|attack|bomb|murder|massacre|assassin|terror|strike|died|death|dead|shoot|crash|disaster|genocide|execut|invasion|invade|riot|explosion|hostage|militant|coup|nazi|holocaust|earthquake|famine|sank|sinking|guillotin|uprising|occupation|military|battle|slave|plague|epidemic|hanged|prison"
    events = []
    for ev in [e for e in data.get("selected", []) if not re.search(DARK, e.get("text", ""), re.I)][:12]:
        page = (ev.get("pages") or [{}])[0]
        events.append({"year": ev.get("year"), "text": clean(ev.get("text"), 220), "link": page.get("content_urls", {}).get("desktop", {}).get("page", "")})
    if events:
        on_this_day = {"date": now.strftime("%m-%d"), "events": events}
except Exception as e:
    errors.append(f"Wikipedia: {e}"[:200])

out = {
    "updated": now.isoformat(timespec="minutes"),
    "days": days,
    "onThisDay": on_this_day or old.get("onThisDay"),
    "candidates_today": len(candidates),
    "errors": errors,
}
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(f"today: {days.get(today, {}).get('headline')!r} ({days.get(today, {}).get('written_by')}) · {len(candidates)} candidates · errors: {errors}")

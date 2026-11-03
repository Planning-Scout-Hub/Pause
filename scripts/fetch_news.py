"""
Collects today's good news + "on this day in history" into news.json.
Runs every morning on GitHub Actions (see .github/workflows/daily.yml).
Only uses the Python standard library. If a source fails, the others still work,
and if everything fails the previous news.json is kept.
"""
import json, re, html, datetime as dt, urllib.request, email.utils, os, sys
import xml.etree.ElementTree as ET

FEEDS = [
    ("Good News Network", "https://www.goodnewsnetwork.org/feed/"),
    ("Positive News", "https://www.positive.news/feed/"),
    ("Reasons to be Cheerful", "https://reasonstobecheerful.world/feed/"),
    ("The Guardian · The Upside", "https://www.theguardian.com/world/series/the-upside/rss"),
]
TOPICS = [  # first match wins; anything else is "People"
    ("Climate", r"climat|carbon|emission|renewabl|solar|wind (farm|power)|forest|reef|ocean|wildlife|species|conservation|rewild|biodivers|plastic|recycl|endangered|whale|bird"),
    ("Health", r"health|cancer|vaccine|disease|patient|medic|hospital|therapy|cure|drug|brain|mental"),
    ("Tech", r"\btech|robot|\bai\b|artificial intelligence|battery|electric|app\b|software|invent|engineer|3d[- ]print|satellite"),
    ("Science", r"scien|research|study|discover|fossil|archaeolog|ancient|space|nasa|planet|telescope|physic|chemist|genom"),
]
UA = {"User-Agent": "PauseDailyBot/1.0 (+https://planning-scout-hub.github.io/Pause/)"}
OUT = os.path.join(os.path.dirname(__file__), "..", "news.json")

def get(url, timeout=25):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()

def clean(text, limit=230):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"(The post .* appeared first on .*|Continue reading.*|Read more.*)$", "", text).strip()
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return text

def parse_date(s):
    try:
        d = email.utils.parsedate_to_datetime(s)
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except Exception:
        return None

def topic_for(text):
    for name, pattern in TOPICS:
        if re.search(pattern, text, re.I):
            return name
    return "People"

stories, errors = [], []
now = dt.datetime.now(dt.timezone.utc)
for source, url in FEEDS:
    try:
        root = ET.fromstring(get(url))
        for item in root.iter("item"):
            title = clean(item.findtext("title"), 160)
            link = (item.findtext("link") or "").strip()
            date = parse_date(item.findtext("pubDate") or "")
            if not title or not link.startswith("http") or not date:
                continue
            if re.search(r"^good news in history|^weekly roundup|^the week in good news", title, re.I):
                continue  # round-ups, not stories
            if (now - date).days > 10:
                continue
            summary = clean(item.findtext("description"))
            cats = " ".join(c.text or "" for c in item.findall("category"))
            stories.append({
                "title": title, "summary": summary, "link": link, "source": source,
                "date": date.date().isoformat(), "topic": topic_for(f"{title} {summary} {cats}"),
            })
    except Exception as e:  # keep going if one source is down
        errors.append(f"{source}: {e}")

# newest first, no duplicate headlines, and a mix of topics
stories.sort(key=lambda s: s["date"], reverse=True)
seen, picked, per_topic = set(), [], {}
for s in stories:
    key = re.sub(r"\W+", "", s["title"].lower())[:60]
    if key in seen or per_topic.get(s["topic"], 0) >= 3:
        continue
    seen.add(key); per_topic[s["topic"]] = per_topic.get(s["topic"], 0) + 1
    picked.append(s)
    if len(picked) >= 10:
        break

# On this day in history (Wikipedia, selected events)
on_this_day = []
try:
    today = now
    data = json.loads(get(f"https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/{today:%m}/{today:%d}"))
    DARK = r"kill|war\b|wars\b|attack|bomb|murder|massacre|assassin|terror|strike|died|death|dead|shoot|crash|disaster|genocide|execut|invasion|invade|riot|explosion|hostage|militant|coup|nazi|holocaust|earthquake|famine|sank|sinking|guillotin|uprising|occupation|military|battle|slave|plague|epidemic|hanged|prison"
    for ev in [e for e in data.get("selected", []) if not re.search(DARK, e.get("text", ""), re.I)][:12]:
        page = (ev.get("pages") or [{}])[0]
        on_this_day.append({
            "year": ev.get("year"), "text": clean(ev.get("text"), 220),
            "link": page.get("content_urls", {}).get("desktop", {}).get("page", ""),
        })
except Exception as e:
    errors.append(f"Wikipedia: {e}")

if not picked and not on_this_day:
    print("Nothing fetched, keeping previous news.json", errors, file=sys.stderr)
    sys.exit(0)

old = {}
try:
    old = json.load(open(OUT))
except Exception:
    pass
out = {
    "updated": now.isoformat(timespec="minutes"),
    "stories": picked or old.get("stories", []),
    "onThisDay": {"date": now.strftime("%m-%d"), "events": on_this_day} if on_this_day else old.get("onThisDay"),
    "errors": errors,
}
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(f"{len(picked)} stories, {len(on_this_day)} on-this-day events, errors: {errors}")

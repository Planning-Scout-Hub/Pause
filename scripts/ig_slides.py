"""
PausKIT Instagram slide maker.
Usage:  python3 scripts/ig_slides.py ig/specs/<name>.json
Spec:   {"name": "goodnews-2026-11-23", "slides": [ {...}, ... ]}
Slide types:
  {"type":"cover", "tag":"TODAY'S FOOD FOR THOUGHT", "title":"...", "body":"... (<br> allowed)", "emoji":"🤯"}
  {"type":"item",  "num":"1", "title":"...", "body":"...", "emoji":"🧠", "source":"Gill et al., eLife, 2022"}
  {"type":"cta",   "tag":"YOUR TURN", "title":"...", "body":"...", "box":"... pauskit.com · link in bio"}
Writes ig/<name>-1.jpg ... (1080x1350, 4:5) using the app's own fonts.
"""
import json, sys, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = """
@font-face{font-family:Shadows;src:url(FONTDIR/shadows.woff2)}
@font-face{font-family:Kalam;src:url(FONTDIR/kalam-700.woff2);font-weight:700}
@font-face{font-family:Nunito;src:url(FONTDIR/nunito-600.woff2);font-weight:600}
@font-face{font-family:Nunito;src:url(FONTDIR/nunito-800.woff2);font-weight:800}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;background:#F3E9D8;font-family:Nunito;color:#3B2A20;position:relative;overflow:hidden}
.paper{position:absolute;inset:48px;background:#FFFBF4;border-radius:36px;box-shadow:0 18px 40px rgba(90,50,20,.18);padding:90px 84px;display:flex;flex-direction:column}
.lines{position:absolute;inset:0;border-radius:36px;background:repeating-linear-gradient(#FFFBF4 0 63px,#EADFCF 63px 65px);opacity:.55}
.margin{position:absolute;top:0;bottom:0;left:64px;width:3px;background:#E7B8A6}
.brand{position:absolute;top:44px;left:84px;font-family:Shadows;font-size:44px;color:#8B3A17}
.count{position:absolute;top:52px;right:84px;font-weight:800;font-size:28px;color:#B07A55;letter-spacing:2px}
.tag{display:inline-block;align-self:flex-start;background:#F6D9A8;color:#7A3A12;font-weight:800;font-size:28px;letter-spacing:3px;padding:12px 24px;border-radius:14px;margin-top:70px;position:relative}
.num{font-family:Kalam;font-weight:700;font-size:150px;color:#E39A5E;line-height:1;margin-top:60px;position:relative}
h1{font-family:Kalam;font-weight:700;font-size:92px;line-height:1.08;color:#8B3A17;margin-top:30px;position:relative}
h2{font-family:Kalam;font-weight:700;font-size:76px;line-height:1.12;color:#8B3A17;margin-top:10px;position:relative}
p{font-size:38px;line-height:1.45;margin-top:40px;position:relative}
.src{font-size:28px;color:#9A8576;margin-top:auto;position:relative}
.ask{margin-top:auto;background:#8B3A17;color:#FFF7EC;border-radius:28px;padding:34px 40px;font-size:38px;line-height:1.35;font-weight:800;position:relative}
.swipe{margin-top:auto;font-family:Kalam;font-weight:700;font-size:54px;color:#C2622D;position:relative}
.big{font-size:44px}
.deco{position:absolute;right:70px;bottom:175px;font-size:210px;line-height:1;filter:saturate(.85);opacity:.92}
.deco0{position:absolute;right:84px;top:150px;font-size:120px}
"""

CSS = CSS.replace("FONTDIR/", (ROOT / "fonts").as_uri() + "/")
CSS = CSS.replace(".big{font-size:44px}", ".big{font-size:44px}\n.deco{position:absolute;right:70px;bottom:175px;font-size:210px;line-height:1;opacity:.92}\n.deco0{position:absolute;right:84px;top:150px;font-size:120px}")
def page(inner, n, total):
    c = f'<div class="count">{n}/{total}</div>' if n > 1 else ''
    return f'<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="paper"><div class="lines"></div><div class="margin"></div><div class="brand">PausKIT</div>{c}{inner}</div></body></html>'
def render(spec):
    S = spec["slides"]; T = len(S); html = []
    for i, s in enumerate(S, 1):
        e = s.get("emoji", "")
        if s["type"] == "cover":
            inner = f'<div class="tag">{s.get("tag","")}</div><h1 style="font-size:{s.get("size",118)}px;margin-top:70px">{s["title"]}</h1><p class="big">{s.get("body","")}</p>' + (f'<div class="deco0">{e}</div>' if e else '') + '<div class="swipe">swipe →</div>'
        elif s["type"] == "item":
            inner = (f'<div class="num">{s["num"]}</div>' if s.get("num") else '') + (f'<h2>' if s.get("num") else '<h2 style="margin-top:110px">') + f'{s["title"]}</h2><p>{s.get("body","")}</p>' + (f'<div class="deco">{e}</div>' if e else '') + (f'<div class="src">Source: {s["source"]}</div>' if s.get("source") else '')
        else:
            inner = f'<div class="tag">{s.get("tag","YOUR TURN")}</div><h1 style="margin-top:60px">{s["title"]}</h1><p class="big">{s.get("body","")}</p><div class="ask">{s.get("box","")}</div>'
        html.append(page(inner, i, T))
    out = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1350})
        for i, h in enumerate(html, 1):
            tmp = ROOT / f".slide{i}.html"; tmp.write_text(h, encoding="utf-8")
            pg.goto(tmp.as_uri()); pg.wait_for_timeout(400)
            f = ROOT / "ig" / f'{spec["name"]}-{i}.jpg'; pg.screenshot(path=str(f), type="jpeg", quality=92); out.append(f); tmp.unlink()
        b.close()
    return out
if __name__ == "__main__":
    for f in render(json.load(open(sys.argv[1], encoding="utf-8"))): print(f)

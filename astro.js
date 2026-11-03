// ─────────────────────────────────────────────────────────────
//  ASTRO ENGINE
//  Real sky positions from the astronomy-engine library (NASA-grade
//  ephemeris, accurate to well under a degree). Tropical zodiac,
//  geocentric positions, true ecliptic of date.
//  Interpretations follow traditional Western astrology meanings.
// ─────────────────────────────────────────────────────────────

const A = () => window.Astronomy;

export const SIGNS = [
  { name: "Aries", glyph: "♈", element: "Fire", mode: "Cardinal" },
  { name: "Taurus", glyph: "♉", element: "Earth", mode: "Fixed" },
  { name: "Gemini", glyph: "♊", element: "Air", mode: "Mutable" },
  { name: "Cancer", glyph: "♋", element: "Water", mode: "Cardinal" },
  { name: "Leo", glyph: "♌", element: "Fire", mode: "Fixed" },
  { name: "Virgo", glyph: "♍", element: "Earth", mode: "Mutable" },
  { name: "Libra", glyph: "♎", element: "Air", mode: "Cardinal" },
  { name: "Scorpio", glyph: "♏", element: "Water", mode: "Fixed" },
  { name: "Sagittarius", glyph: "♐", element: "Fire", mode: "Mutable" },
  { name: "Capricorn", glyph: "♑", element: "Earth", mode: "Cardinal" },
  { name: "Aquarius", glyph: "♒", element: "Air", mode: "Fixed" },
  { name: "Pisces", glyph: "♓", element: "Water", mode: "Mutable" },
];

export const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const GLYPH = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇" };
export const glyph = (p) => GLYPH[p] || "";

export const ASPECTS = [
  { name: "conjunction", angle: 0, word: "meets", tone: "intensifies" },
  { name: "sextile", angle: 60, word: "supports", tone: "opens a door" },
  { name: "square", angle: 90, word: "challenges", tone: "creates friction" },
  { name: "trine", angle: 120, word: "flows with", tone: "flows easily" },
  { name: "opposition", angle: 180, word: "faces", tone: "asks for balance" },
];

// What each planet represents (traditional astrology)
export const PLANET_MEANING = {
  Sun: "your core self and vitality", Moon: "your feelings and needs", Mercury: "how you think and talk",
  Venus: "love, pleasure and what you value", Mars: "drive, desire and anger", Jupiter: "growth, luck and faith",
  Saturn: "limits, responsibility and time", Uranus: "change and freedom", Neptune: "dreams, intuition and longing",
  Pluto: "power and transformation", Ascendant: "how you meet the world",
};

// What the Moon in each sign tends to bring (traditional astrology)
export const MOON_IN = {
  Aries: "Feelings run hot and fast. Good for starting things, less good for patience.",
  Taurus: "A steadier, more sensual mood. Comfort, food and slowness feel right.",
  Gemini: "A restless, chatty mood. Curiosity is high and attention jumps around.",
  Cancer: "Feelings sit close to the surface. Home, family and comfort matter more today.",
  Leo: "A warm, expressive mood. People want to be seen, to play and to be appreciated.",
  Virgo: "A practical, detail-minded mood. Tidying, fixing and helping feel satisfying.",
  Libra: "Relationships take centre stage. Fairness, beauty and harmony feel important.",
  Scorpio: "An intense, private mood. Things below the surface want attention.",
  Sagittarius: "An optimistic, restless mood. Big questions, travel and honesty are in the air.",
  Capricorn: "A serious, focused mood. Good for structure, goals and getting things done.",
  Aquarius: "A detached, inventive mood. Friends, ideas and doing things differently.",
  Pisces: "A soft, dreamy mood. Imagination, empathy and rest come more easily.",
};

const SIGN_THEME = {
  Aries: "Fear", Taurus: "The Body", Gemini: "Curiosity", Cancer: "Home", Leo: "Laughter", Virgo: "Small Wonders",
  Libra: "Kindness", Scorpio: "Change", Sagittarius: "Stories", Capricorn: "Time", Aquarius: "The Self", Pisces: "Calm",
};

// ── Core calculations ────────────────────────────────────────
export function lon(body, date) {
  const Ast = A();
  if (body === "Moon") return Ast.EclipticGeoMoon(date).lon;
  return Ast.Ecliptic(Ast.GeoVector(Ast.Body[body], date, true)).elon;
}
const norm = (x) => ((x % 360) + 360) % 360;
export const signOf = (l) => SIGNS[Math.floor(norm(l) / 30)];
export const degIn = (l) => Math.floor(norm(l) % 30);
export const fmtPos = (l) => `${degIn(l)}° ${signOf(l).name}`;

export function isRetro(body, date) {
  if (body === "Sun" || body === "Moon") return false;
  const d = 6 * 3600e3;
  const a = lon(body, new Date(date.getTime() - d)), b = lon(body, new Date(date.getTime() + d));
  return norm(b - a + 180) - 180 < 0;
}

export function positions(date) {
  const out = {};
  for (const p of PLANETS) {
    const l = lon(p, date);
    out[p] = { lon: l, sign: signOf(l), deg: degIn(l), retro: isRetro(p, date) };
  }
  return out;
}

function sep(a, b) { const d = Math.abs(norm(a - b)); return d > 180 ? 360 - d : d; }
export function aspectBetween(a, b, orb) {
  const s = sep(a, b);
  let best = null;
  for (const asp of ASPECTS) {
    const o = Math.abs(s - asp.angle);
    if (o <= orb && (!best || o < best.orb)) best = { ...asp, orb: o };
  }
  return best;
}

// Ascendant from UTC time + geographic coordinates
export function ascendant(date, latDeg, lonDeg) {
  const Ast = A();
  const gast = Ast.SiderealTime(date);                       // hours
  const ramc = norm(gast * 15 + lonDeg) * Math.PI / 180;     // local sidereal angle
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const eps = (23.439291 - 0.0130042 * T) * Math.PI / 180;
  const phi = latDeg * Math.PI / 180;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm(asc * 180 / Math.PI);
}

// ── Time zones (birth times are local; we need UTC) ───────────
function tzOffsetMs(ms, tz) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  const g = (t) => +p.find((x) => x.type === t).value;
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - ms;
}
export function zonedToUtc(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = (timeStr || "12:00").split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let guess = wall;
  for (let i = 0; i < 3; i++) guess = wall - tzOffsetMs(guess, tz || "UTC");
  return new Date(guess);
}

// ── Today's sky (for the viewer's local day) ─────────────────
export function skyForDay(localDate = new Date()) {
  const Ast = A();
  const start = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  const noon = new Date(start.getTime() + 12 * 3600e3);
  const pos = positions(noon);
  const events = [];

  // Moon phases (exact moment within today)
  const q = Ast.SearchMoonQuarter(start);
  if (q && q.time.date < end) {
    const names = ["New Moon", "First Quarter Moon", "Full Moon", "Last Quarter Moon"];
    const l = lon("Moon", q.time.date);
    events.push({ type: "phase", quarter: q.quarter, title: `${names[q.quarter]} in ${signOf(l).name}`, sign: signOf(l).name, time: q.time.date, weight: q.quarter % 2 === 0 ? 90 : 60 });
  }
  // Eclipses within today
  try {
    const le = Ast.SearchLunarEclipse(start);
    if (le && le.peak.date < end && le.kind !== "penumbral") events.push({ type: "eclipse", title: `${cap(le.kind)} lunar eclipse`, sign: signOf(lon("Moon", le.peak.date)).name, time: le.peak.date, weight: 100 });
    const se = Ast.SearchGlobalSolarEclipse(start);
    if (se && se.peak.date < end) events.push({ type: "eclipse", title: `${cap(se.kind)} solar eclipse`, sign: signOf(lon("Sun", se.peak.date)).name, time: se.peak.date, weight: 100 });
  } catch { /* ignore */ }

  // Sign changes (ingresses) and stations, checked hour by hour
  for (const p of PLANETS) {
    const steps = p === "Moon" ? 24 : 4;
    for (let i = 0; i < steps; i++) {
      const t0 = new Date(start.getTime() + (i * 86400000) / steps), t1 = new Date(start.getTime() + ((i + 1) * 86400000) / steps);
      const s0 = signOf(lon(p, t0)), s1 = signOf(lon(p, t1));
      if (s0.name !== s1.name) {
        const w = { Sun: 85, Moon: 30, Mercury: 70, Venus: 70, Mars: 72, Jupiter: 88, Saturn: 88, Uranus: 92, Neptune: 92, Pluto: 92 }[p];
        events.push({ type: "ingress", planet: p, title: `${p} enters ${s1.name}`, sign: s1.name, from: s0.name, time: t1, weight: w });
      }
    }
    if (p !== "Sun" && p !== "Moon") {
      const r0 = isRetro(p, start), r1 = isRetro(p, end);
      if (r0 !== r1) events.push({ type: "station", planet: p, retro: r1, title: `${p} turns ${r1 ? "retrograde" : "direct"} in ${pos[p].sign.name}`, sign: pos[p].sign.name, weight: 80 });
    }
  }

  // Exact major aspects between planets today (Moon excluded: it makes many a day)
  const slow = PLANETS.filter((p) => p !== "Moon");
  for (let i = 0; i < slow.length; i++) for (let j = i + 1; j < slow.length; j++) {
    const a = slow[i], b = slow[j];
    for (const asp of ASPECTS) {
      const f = (t) => sep(lon(a, t), lon(b, t)) - asp.angle;
      const f0 = f(start), f1 = f(end);
      if (Math.sign(f0) !== Math.sign(f1) && Math.abs(f0) < 3 && Math.abs(f1) < 3) {
        if (asp.angle === 0 && a === "Sun" && (b === "Mercury" || b === "Venus")) { /* still valid */ }
        events.push({ type: "aspect", a, b, aspect: asp, sign: pos[a].sign.name, title: `${a} ${asp.name} ${b}`, weight: 40 + (["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(b) ? 15 : 0) });
      }
    }
  }

  events.sort((x, y) => y.weight - x.weight);
  const moon = pos.Moon;
  const phaseAngle = Ast.MoonPhase(noon);
  const illum = Ast.Illumination(Ast.Body.Moon, noon);
  const moonDistKm = Ast.GeoMoon(noon).Length() * 149597870.7;
  const retros = PLANETS.filter((p) => pos[p].retro);

  const headline = events[0] || { type: "moon", title: `Moon in ${moon.sign.name}`, sign: moon.sign.name, weight: 0 };
  const theme = themeFor(headline, moon.sign.name);

  return {
    date: start, pos, events, headline, theme, retros,
    moon: { sign: moon.sign.name, phaseName: phaseName(phaseAngle), phaseAngle, illumination: illum.phase_fraction, distanceKm: moonDistKm },
  };
}

function themeFor(h, moonSign) {
  if (h.type === "eclipse") return "Change";
  if (h.type === "phase" && h.quarter === 0) return "Beginnings";
  if (h.type === "phase" && h.quarter === 2) return "Nature";
  if (h.type === "phase" && h.quarter === 3) return "Rest";
  if (h.type === "station" && h.planet === "Mercury") return "Stories";
  if (h.type === "station" || h.type === "ingress") return SIGN_THEME[h.sign] || SIGN_THEME[moonSign];
  return SIGN_THEME[moonSign];
}

function phaseName(a) {
  if (a < 10 || a >= 350) return "New Moon";
  if (a < 80) return "Waxing Crescent";
  if (a < 100) return "First Quarter";
  if (a < 170) return "Waxing Gibbous";
  if (a < 190) return "Full Moon";
  if (a < 260) return "Waning Gibbous";
  if (a < 280) return "Last Quarter";
  return "Waning Crescent";
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Plain-language explanation of the day's headline ─────────
export function explainHeadline(sky) {
  const h = sky.headline;
  const s = (n) => n; // sign name
  switch (h.type) {
    case "eclipse": return `Eclipses are traditionally seen as turning points: endings and beginnings arriving faster than planned. In ${s(h.sign)}, the spotlight falls on ${SIGN_TOPIC[h.sign]}.`;
    case "phase":
      return [
        `The New Moon is the start of the lunar cycle, traditionally a time to set intentions. In ${s(h.sign)}, the seed to plant is about ${SIGN_TOPIC[h.sign]}.`,
        `The First Quarter Moon is the cycle's first test: action meets resistance. In ${s(h.sign)}, it's about ${SIGN_TOPIC[h.sign]}.`,
        `The Full Moon is the peak of the lunar cycle: things come to light and feelings run high. In ${s(h.sign)}, it illuminates ${SIGN_TOPIC[h.sign]}.`,
        `The Last Quarter Moon is a time to let go and clear space before the next cycle. In ${s(h.sign)}, release what no longer serves ${SIGN_TOPIC[h.sign]}.`,
      ][h.quarter];
    case "ingress": return h.planet === "Moon"
      ? `The Moon, which rules ${PLANET_MEANING.Moon}, moves from ${h.from} into ${s(h.sign)}. ${MOON_IN[h.sign]} The focus shifts toward ${SIGN_TOPIC[h.sign]}.`
      : `${h.planet === "Sun" ? "The Sun" : h.planet}, which rules ${PLANET_MEANING[h.planet]}, moves from ${h.from} into ${s(h.sign)}. Its energy shifts toward ${SIGN_TOPIC[h.sign]}.`;
    case "station": return h.retro
      ? `${h.planet} appears to move backwards from Earth's point of view (an optical effect of orbits). Astrologers read this as a time to review and redo matters of ${PLANET_MEANING[h.planet]}.`
      : `${h.planet} ends its retrograde and starts moving forward again. Matters of ${PLANET_MEANING[h.planet]} that felt stuck can begin to move.`;
    case "aspect": return `${h.a} (${PLANET_MEANING[h.a]}) ${h.aspect.word} ${h.b} (${PLANET_MEANING[h.b]}). In astrology a ${h.aspect.name} ${h.aspect.tone}.`;
    default: return `With no major event today, the Moon sets the mood. ${MOON_IN[sky.moon.sign]}`;
  }
}

export const SIGN_TOPIC = {
  Aries: "courage, starting over and acting on your own behalf", Taurus: "your body, comfort, money and what you value",
  Gemini: "conversations, learning and curiosity", Cancer: "home, family and feeling safe",
  Leo: "joy, creativity and being seen", Virgo: "health, routines and the small details",
  Libra: "relationships, fairness and balance", Scorpio: "intimacy, trust and transformation",
  Sagittarius: "meaning, adventure and honesty", Capricorn: "ambition, responsibility and long-term goals",
  Aquarius: "friendship, community and freedom", Pisces: "dreams, compassion and rest",
};

// ── Birth chart ──────────────────────────────────────────────
export function natalChart(profile) {
  if (!profile?.birth_date) return null;
  const hasTime = !!profile.birth_time;
  const utc = zonedToUtc(profile.birth_date, profile.birth_time, profile.tz);
  const pos = positions(utc);
  let asc = null;
  if (hasTime && profile.lat != null && profile.lon != null) asc = ascendant(utc, profile.lat, profile.lon);
  return { utc, pos, asc, ascSign: asc != null ? signOf(asc) : null, hasTime };
}

// Whole-sign house of a longitude, counted from the rising sign
export function wholeSignHouse(l, asc) {
  return ((Math.floor(norm(l) / 30) - Math.floor(norm(asc) / 30) + 12) % 12) + 1;
}
export const HOUSE_TOPIC = [null,
  "you, your body and how you come across", "money, possessions and self-worth", "conversations, siblings and your neighbourhood",
  "home, family and your roots", "romance, creativity and fun", "work routines and health",
  "partnerships and one-to-one relationships", "intimacy, shared resources and change", "travel, study and big ideas",
  "career and public life", "friends, groups and hopes", "rest, solitude and the unconscious"];

// Today's sky against a birth chart
export function personalDay(sky, chart) {
  const notes = [];
  const transiting = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
  const natalPoints = ["Sun", "Moon", "Venus", "Mars"];
  const targets = natalPoints.map((p) => ({ name: `natal ${p}`, key: p, lon: chart.pos[p].lon }));
  if (chart.asc != null) targets.push({ name: "Ascendant", key: "Ascendant", lon: chart.asc });
  for (const t of transiting) {
    for (const n of targets) {
      if (n.key === "Moon" && !chart.hasTime) continue; // natal Moon too uncertain without birth time
      const orb = t === "Moon" ? 4 : 2;
      const a = aspectBetween(sky.pos[t].lon, n.lon, orb);
      if (a) notes.push({ transit: t, target: n, aspect: a, score: (t === "Moon" ? 1 : 3) + (2 - Math.min(a.orb, 2)) });
    }
  }
  notes.sort((x, y) => y.score - x.score);
  const seen = new Set();
  const unique = notes.filter((n) => (seen.has(n.transit) ? false : seen.add(n.transit)));
  notes.length = 0; notes.push(...unique);
  const house = chart.asc != null ? wholeSignHouse(sky.pos.Moon.lon, chart.asc) : null;
  return { notes: notes.slice(0, 2), moonHouse: house };
}

// Horoscope-style readings: what each moving planet does to a part of your chart.
// "soft" = trine or sextile, "hard" = square or opposition (traditional meanings).
const AREA = {
  Sun: "your confidence and sense of self", Moon: "your emotions and what you need to feel safe",
  Venus: "your love life and what you enjoy", Mars: "your energy and drive", Ascendant: "the way you come across to others",
};
const READ = {
  Sun: {
    conjunction: "The spotlight is on {a}. You'll feel more visible and more like yourself, so take the lead.",
    soft: "Things flow your way with {a}. Confidence comes easily today, so use it to ask for what you want.",
    hard: "Something may knock {a}. Don't take it personally: it's showing you where an old habit no longer fits.",
  },
  Moon: {
    conjunction: "Feelings run close to the surface around {a}. Be gentle with yourself and don't decide anything big on mood alone.",
    soft: "A comfortable, easy mood supports {a}. Good for small pleasures and honest chats.",
    hard: "You may feel touchy about {a}, but it passes within the day. Eat, rest, and wait before replying to anything that annoys you.",
  },
  Mercury: {
    conjunction: "Your mind is busy with {a}. Write it down, have the conversation, send the message.",
    soft: "Words come easily where {a} is concerned. A good moment to explain yourself or clear up a misunderstanding.",
    hard: "Mixed messages are likely around {a}. Double-check what you heard before reacting, and reread texts before you send them.",
  },
  Venus: {
    conjunction: "Warmth and charm are on your side with {a}. Treat yourself, dress up, say something kind.",
    soft: "A sweet, easy energy surrounds {a}. Good for dates, making up and anything beautiful.",
    hard: "You may want more than you're getting around {a}. Watch for overspending or chasing approval to fill the gap.",
  },
  Mars: {
    conjunction: "Big energy around {a}. Put it into a workout or a task you've been avoiding, not into an argument.",
    soft: "Extra drive fuels {a}. A great day to start or finish something.",
    hard: "Patience runs short around {a}. Pick your battles, and move your body to burn off the tension.",
  },
  Jupiter: {
    conjunction: "Luck and generosity grow around {a}. Say yes to opportunities and think bigger than usual.",
    soft: "Optimism lifts {a}. Doors open more easily, so ask, apply, reach out.",
    hard: "The risk is too much of a good thing with {a}: overpromising, overdoing, overspending. Aim high but stay realistic.",
  },
  Saturn: {
    conjunction: "A serious, testing time for {a}. Slow, steady effort now builds something that lasts.",
    soft: "Discipline pays off with {a}. A good day for commitments, plans and grown-up decisions.",
    hard: "{A} may feel heavy or blocked. It's not a no, it's a not yet: be patient and keep doing the work.",
  },
};
const RETRO_NOTE = { Mercury: " Mercury is retrograde, so it's better for revisiting than for starting.", Venus: " Venus is retrograde, so old feelings or exes may resurface." };
export function describeTransit(n, retro) {
  const kind = n.aspect.name === "conjunction" ? "conjunction" : ["trine", "sextile"].includes(n.aspect.name) ? "soft" : "hard";
  const a = AREA[n.target.key];
  const text = READ[n.transit][kind].replace("{a}", a).replace("{A}", a.charAt(0).toUpperCase() + a.slice(1));
  return text + (retro && RETRO_NOTE[n.transit] ? RETRO_NOTE[n.transit] : "");
}

// "Your day": what it means when the day's main event lands in each house
export const HOUSE_READING = [null,
  { text: "All eyes are on you. You'll feel more noticed and more like yourself: a good day for a fresh start, a new look or putting yourself first.", good: "new beginnings, self-care, taking the lead", easy: "trying to do everything alone" },
  { text: "Money, possessions and self-worth come into focus. Check your budget, value your time, and notice what you truly can't live without.", good: "budgeting, treating yourself wisely, knowing your worth", easy: "impulse buys" },
  { text: "Your mind is quick and chatty. Messages, short trips, siblings and neighbours feature. Say what you mean and learn something new.", good: "conversations, writing, errands", easy: "gossip and overthinking" },
  { text: "Home and family pull at you. Cook, tidy, call family, or simply stay in. You'll recharge best somewhere you feel safe.", good: "home, family time, a cosy evening", easy: "overcommitting outside the house" },
  { text: "Play, romance and creativity light up. Do something purely for fun, flirt a little, make something with your hands.", good: "dates, hobbies, creative projects", easy: "taking life too seriously" },
  { text: "Routines, health and everyday tasks need attention. Small improvements go a long way: a walk, a clean inbox, an early night.", good: "organising, exercise, healthy habits", easy: "perfectionism" },
  { text: "Other people take centre stage. Partners, close friends and one-to-one conversations matter most. Listen as much as you talk.", good: "partnerships, compromise, meeting up", easy: "people-pleasing" },
  { text: "Deep feelings and hidden matters surface. Trust, intimacy and shared money are in focus. Let go of something you've been holding on to.", good: "honest talks, letting go, research", easy: "jealousy and control" },
  { text: "Your horizons widen. Plan a trip, read something that challenges you, ask the big questions. Curiosity is your compass.", good: "learning, travel plans, big-picture thinking", easy: "preaching to others" },
  { text: "Career and reputation are in focus. People notice what you do, so show up well and take one step toward a long-term goal.", good: "work goals, ambition, being seen", easy: "neglecting rest" },
  { text: "Friends and groups bring good energy. Reach out, join in, and think about what you hope for in the future.", good: "friends, teamwork, future plans", easy: "comparing yourself to others" },
  { text: "A day to slow down and recharge. Your energy is better spent on rest, reflection and time alone than on pushing ahead. Pay attention to dreams and gut feelings.", good: "rest, journaling, quiet time", easy: "big launches and crowds" },
];

// ── Compatibility (synastry) ─────────────────────────────────
const ELEMENT_FIT = { "Fire-Fire": 3, "Earth-Earth": 3, "Air-Air": 3, "Water-Water": 3, "Fire-Air": 2, "Air-Fire": 2, "Earth-Water": 2, "Water-Earth": 2 };
const PAIRS = [
  ["Sun", "Sun", "how your core selves get along"], ["Moon", "Moon", "emotional understanding"], ["Sun", "Moon", "how one of you supports the other"],
  ["Moon", "Sun", "how one of you supports the other"], ["Venus", "Mars", "attraction and chemistry"], ["Mars", "Venus", "attraction and chemistry"],
  ["Mercury", "Mercury", "how you talk and think together"], ["Venus", "Venus", "shared tastes and affection"],
];
export function compatibility(a, b) {
  const links = [];
  let score = 50;
  for (const [pa, pb, topic] of PAIRS) {
    if ((pa === "Moon" && !a.hasTime) || (pb === "Moon" && !b.hasTime)) continue;
    const asp = aspectBetween(a.pos[pa].lon, b.pos[pb].lon, 7);
    if (asp) {
      const good = ["trine", "sextile", "conjunction"].includes(asp.name);
      score += good ? 8 : -3;
      links.push({ pa, pb, topic, aspect: asp, good });
    }
  }
  const ea = a.pos.Sun.sign.element, eb = b.pos.Sun.sign.element;
  score += (ELEMENT_FIT[`${ea}-${eb}`] || 0) * 4;
  score = Math.max(15, Math.min(98, Math.round(score)));
  return { score, links, elements: [ea, eb] };
}

// What today's sky is doing to the two of you
export function todayBetween(sky, a, b) {
  const t = ["Moon", "Venus", "Mars", "Mercury", "Sun"];
  for (const p of t) {
    const x = aspectBetween(sky.pos[p].lon, a.pos.Sun.lon, p === "Moon" ? 4 : 2);
    const y = aspectBetween(sky.pos[p].lon, b.pos.Sun.lon, p === "Moon" ? 4 : 2);
    if (x && y) return `Today's ${p} touches both your Suns (${x.name} to yours, ${y.name} to theirs). In astrology that puts ${PLANET_MEANING[p]} at the centre of your connection today.`;
  }
  const sa = a.pos.Sun.sign.element, sb = b.pos.Sun.sign.element, me = sky.pos.Moon.sign.element;
  if (me === sa || me === sb) return `Today's Moon is in ${sky.moon.sign}, a ${me} sign, like ${me === sa && me === sb ? "both of your" : me === sa ? "your" : "their"} Sun. A good day to reach out and talk about how you're both feeling.`;
  return `No strong link between you in today's sky. A quiet day for this connection: a short message goes a long way.`;
}

// ── Personal theme: where today's main event lands in YOUR chart ──
const HOUSE_THEME = [null, "The Self", "Small Wonders", "Curiosity", "Home", "Laughter", "The Body", "Kindness", "Change", "Stories", "Time", "Beginnings", "Calm"];
export const HOUSE_SHORT = [null, "self", "values", "communication", "home", "joy", "health", "relationships", "transformation", "meaning", "career", "friendship", "rest"];
export function personalTheme(sky, chart) {
  const signName = sky.headline.sign || sky.moon.sign;
  const idx = SIGNS.findIndex((x) => x.name === signName);
  // Whole-sign houses from the Rising sign; without a birth time, use the Sun sign as the 1st house (a 'solar chart')
  const first = chart.asc != null ? Math.floor(norm(chart.asc) / 30) : Math.floor(norm(chart.pos.Sun.lon) / 30);
  const house = ((idx - first + 12) % 12) + 1;
  return { theme: HOUSE_THEME[house], house, solar: chart.asc == null };
}

// ── Friendly, eye-catching headline for the sky section ─────
// The technical name (e.g. "Venus sextile Jupiter") is still shown underneath as a small tag.
const NICK = { Sun: "your confidence", Moon: "your feelings", Mercury: "your words", Venus: "love", Mars: "your drive",
  Jupiter: "good luck", Saturn: "discipline", Uranus: "change", Neptune: "imagination", Pluto: "transformation" };
const SKY_PAIRS = {
  "Venus-Jupiter": ["Love and luck are holding hands today", "Big-hearted skies: generosity pays off", "A sweet day: kindness comes back to you"],
  "Venus-Mars": ["Sparks in the air: chemistry is high", "Heart and drive line up: go after what you love"],
  "Sun-Jupiter": ["A lucky, open-hearted day", "Think bigger today: the sky is on your side"],
  "Mercury-Jupiter": ["Big ideas day: say the bold thing", "Good news travels fast today"],
  "Mars-Saturn": ["Slow and steady wins today", "Patience is your superpower today"],
  "Venus-Saturn": ["Love gets serious: show up for what matters", "Small, loyal gestures count double today"],
  "Mercury-Neptune": ["Dreamy minds: great for ideas, not for contracts", "Your imagination is louder than usual"],
  "Venus-Neptune": ["Romance and daydreams are in the air", "A soft, dreamy day for the heart"],
  "Sun-Saturn": ["A grown-up day: steady wins the race"],
  "Mercury-Mars": ["Quick tongue day: count to three before replying", "Sharp mind, fast words: use them kindly"],
  "Jupiter-Saturn": ["Dream big, plan carefully"],
  "Venus-Uranus": ["Expect the unexpected in love and money", "A surprising spark: say yes to something new"],
  "Mars-Jupiter": ["Bold moves pay off today", "Energy to spare: go for the big thing"],
};
const HARMONY = ["{A} and {b} work well together today", "{A} gets a boost from {b}", "An easy day for {a} and {b}"];
const TENSION = ["{A} and {b} need a compromise today", "A little friction between {a} and {b}: go gently", "{A} and {b} pull in different directions"];
const HARD_PAIRS = {
  "Sun-Jupiter": ["Big plans, real limits: aim high but stay realistic"], "Sun-Mars": ["Short fuse day: breathe before you react"],
  "Mercury-Mars": ["Quick tongue day: count to three before replying"], "Venus-Mars": ["Heart vs. head: what you want and what you do may clash"],
  "Mars-Saturn": ["Feeling blocked? Slow and steady wins today"], "Sun-Saturn": ["A heavy-ish day: do one thing well"],
  "Venus-Saturn": ["Love asks for patience today"], "Mercury-Neptune": ["Foggy thinking: double-check facts and plans"],
};
const MEET = ["{A} meets {b}: a fresh mix begins", "{A} and {b} join forces today"];
const MOON_MOOD = {
  Aries: "Bold mood: say yes to a small adventure", Taurus: "Slow and sweet: treat your senses today",
  Gemini: "Chatty skies: follow your curiosity", Cancer: "Cosy mood: home and comfort are calling",
  Leo: "Shine day: let yourself be seen", Virgo: "Tidy-up energy: small fixes feel great",
  Libra: "Peace-making mood: good day to smooth things over", Scorpio: "Deep-feelings day: go beneath the surface",
  Sagittarius: "Wanderlust mood: think big, explore", Capricorn: "Get-it-done energy: one solid step forward",
  Aquarius: "Free-thinking day: try something different", Pisces: "Dreamy mood: rest, imagine, be gentle",
};
const MOON_MOOD2 = {
  Aries: "Spark day: start the thing you keep postponing", Taurus: "Comfort day: good food, soft clothes, slow pace",
  Gemini: "Message day: reach out to someone you miss", Cancer: "Feelings first: look after your inner circle",
  Leo: "Play day: do something just for the joy of it", Virgo: "Fix-it mood: one small task, done well",
  Libra: "Beauty and balance: make your space a little nicer", Scorpio: "Honest mood: say what you really feel",
  Sagittarius: "Big-picture day: ask what really matters", Capricorn: "Steady mood: build something that lasts",
  Aquarius: "Friendly skies: your people lift you up", Pisces: "Soft day: let your mind wander",
};
const INGRESS = {
  Sun: (s) => `A new season begins: the Sun moves into ${s}`, Mercury: (s) => `Your mind changes gear: Mercury moves into ${s}`,
  Venus: (s) => `Love gets a new style: Venus moves into ${s}`, Mars: (s) => `Your energy finds a new direction in ${s}`,
  Jupiter: (s) => `Luck moves house: Jupiter enters ${s}`, Saturn: (s) => `New lessons begin: Saturn enters ${s}`,
  Uranus: (s) => `A once-in-7-years shift: Uranus enters ${s}`, Neptune: (s) => `A dreamy new era: Neptune enters ${s}`,
  Pluto: (s) => `A generational shift: Pluto enters ${s}`,
};
const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function catchyHeadline(sky, seed = 0) {
  const h = sky.headline;
  const pick = (arr) => arr[Math.abs(seed) % arr.length];
  switch (h.type) {
    case "eclipse": return h.title.includes("solar") ? "Eclipse day: a turning point in the sky" : "Eclipse tonight: something comes to a head";
    case "phase": return ["New Moon: a fresh start, set your intentions", "First Quarter Moon: time to act on your plans",
      "Full Moon tonight: what's hidden comes to light", "Last Quarter Moon: clear out what you're done with"][h.quarter];
    case "ingress": return h.planet === "Moon" ? (seed % 2 ? MOON_MOOD2 : MOON_MOOD)[h.sign] : INGRESS[h.planet](h.sign);
    case "station":
      if (h.planet === "Mercury") return h.retro ? "Mercury retrograde begins: double-check, don't rush" : "Mercury moves forward again: stuck things start to flow";
      return h.retro ? `Time to revisit ${NICK[h.planet]}: ${h.planet} turns retrograde` : `${cap1(NICK[h.planet])} moves forward again: ${h.planet} turns direct`;
    case "aspect": {
      const key = [h.a, h.b].join("-");
      const hard = h.aspect.angle === 90 || h.aspect.angle === 180;
      if (hard && HARD_PAIRS[key]) return pick(HARD_PAIRS[key]);
      if (!hard && SKY_PAIRS[key]) return pick(SKY_PAIRS[key]);
      const tpl = h.aspect.angle === 0 ? MEET : hard ? TENSION : HARMONY;
      return pick(tpl).replace("{A}", cap1(NICK[h.a])).replace("{a}", NICK[h.a]).replace("{b}", NICK[h.b]).replace(/^./, (c) => c.toUpperCase());
    }
    default: return (seed % 2 ? MOON_MOOD2 : MOON_MOOD)[sky.moon.sign];
  }
}

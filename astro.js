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
        events.push({ type: "aspect", a, b, aspect: asp, title: `${a} ${asp.name} ${b}`, weight: 40 + (["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(b) ? 15 : 0) });
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
  const house = chart.asc != null ? wholeSignHouse(sky.pos.Moon.lon, chart.asc) : null;
  return { notes: notes.slice(0, 3), moonHouse: house };
}

const ASPECT_ADVICE = {
  conjunction: "This part of you is turned up loud today.",
  sextile: "An easy opening: a small effort here brings good results.",
  square: "Expect some tension here. It's a push to grow, not a bad sign.",
  trine: "Things flow naturally here today, so make the most of it.",
  opposition: "Other people may mirror this back to you. Look for balance.",
};
export function describeTransit(n) {
  const target = n.target.key === "Ascendant" ? "Ascendant" : n.target.key;
  const t = n.transit === "Sun" || n.transit === "Moon" ? `the ${n.transit}` : n.transit;
  return `Today ${t} forms a ${n.aspect.name} with your ${target} (${PLANET_MEANING[n.target.key]}). ${ASPECT_ADVICE[n.aspect.name]}`;
}

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

import { CONFIG } from "./config.js";
import { THOUGHTS, PROMPTS, FACTS } from "./content.js";
import * as Astro from "./astro.js";

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const SITE_URL = location.origin + location.pathname;

// ── Safe localStorage helpers ────────────────────────────────
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const K = {
  drafts: "pause_drafts", pending: "pause_pending", after: "pause_after_auth",
  demoUser: "pause_demo_user", demoEntries: "pause_demo_entries", demoProfile: "pause_demo_profile", demoPeople: "pause_demo_people",
};
// Ask the browser to keep this site's storage even when space is low
try { navigator.storage?.persist?.(); } catch { /* ignore */ }

// ── Today ────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const niceDate = (s, opts = { weekday: "long", day: "numeric", month: "long" }) => parseISO(s).toLocaleDateString("en-GB", opts);
const now = new Date();
const TODAY = isoDate(now);
const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
const pickFrom = (arr, offset = 0) => arr[(dayNumber + offset) % arr.length];

let sky = null;
try { sky = Astro.skyForDay(now); } catch (e) { console.warn("Sky unavailable", e); }
const THEME_LIST = Object.keys(THOUGHTS);
const themeName = sky?.theme && THOUGHTS[sky.theme] ? sky.theme : THEME_LIST[dayNumber % THEME_LIST.length];
const day = {
  theme: themeName,
  thought: pickFrom(THOUGHTS[themeName]),
  prompt: pickFrom(PROMPTS[themeName]),
  fact: pickFrom(FACTS, 6),
};

// ── Backend: Supabase if configured, otherwise browser-only preview ──
const DEMO = !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;
let sb = null;
let user = null;
let profile = null;
let people = [];

const api = {
  async init() {
    if (DEMO) { user = store.get(K.demoUser); return; }
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    user = data.session?.user ?? null;
    sb.auth.onAuthStateChange((_event, session) => {
      const changed = (session?.user?.id || null) !== (user?.id || null);
      user = session?.user ?? null;
      if (changed) setTimeout(onAuthChanged, 0);
    });
  },
  async signUp(email, password) {
    if (DEMO) { user = { id: "demo", email }; store.set(K.demoUser, user); return { needsConfirm: false }; }
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: SITE_URL } });
    if (error) throw error;
    return { needsConfirm: !data.session };
  },
  async signIn(email, password) {
    if (DEMO) { user = { id: "demo", email }; store.set(K.demoUser, user); return; }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() {
    if (DEMO) store.del(K.demoUser); else await sb.auth.signOut();
    user = null; profile = null; people = [];
  },
  // Journal entries
  async listEntries() {
    if (DEMO) return (store.get(K.demoEntries) || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const { data, error } = await sb.from("entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async addEntry(entry) {
    if (DEMO) { const all = store.get(K.demoEntries) || []; const row = { ...entry, id: String(Date.now()), created_at: new Date().toISOString() }; all.push(row); store.set(K.demoEntries, all); return row; }
    const { data, error } = await sb.from("entries").insert(entry).select().single();
    if (error) throw error;
    return data;
  },
  async removeEntry(id) {
    if (DEMO) { store.set(K.demoEntries, (store.get(K.demoEntries) || []).filter((e) => e.id !== id)); return; }
    const { error } = await sb.from("entries").delete().eq("id", id);
    if (error) throw error;
  },
  // Cloud drafts (so unsaved writing survives on any device)
  async saveDraft(date, body) {
    if (DEMO || !user) return;
    if (!body.trim()) { await sb.from("drafts").delete().eq("entry_date", date); return; }
    await sb.from("drafts").upsert({ user_id: user.id, entry_date: date, body, updated_at: new Date().toISOString() }, { onConflict: "user_id,entry_date" });
  },
  async listDrafts() {
    if (DEMO || !user) return [];
    const { data } = await sb.from("drafts").select("entry_date, body, updated_at");
    return data || [];
  },
  async deleteDraft(date) { if (!DEMO && user) await sb.from("drafts").delete().eq("entry_date", date); },
  // Birth profile
  async getProfile() {
    if (DEMO) return store.get(K.demoProfile);
    const { data } = await sb.from("profiles").select("*").maybeSingle();
    return data;
  },
  async saveProfile(p) {
    if (DEMO) { store.set(K.demoProfile, p); return p; }
    const { data, error } = await sb.from("profiles").upsert({ ...p, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select().single();
    if (error) throw error;
    return data;
  },
  // People
  async listPeople() {
    if (DEMO) return store.get(K.demoPeople) || [];
    const { data, error } = await sb.from("people").select("*").order("created_at");
    if (error) throw error;
    return data;
  },
  async addPerson(p) {
    if (DEMO) { const all = store.get(K.demoPeople) || []; const row = { ...p, id: String(Date.now()) }; all.push(row); store.set(K.demoPeople, all); return row; }
    const { data, error } = await sb.from("people").insert(p).select().single();
    if (error) throw error;
    return data;
  },
  async removePerson(id) {
    if (DEMO) { store.set(K.demoPeople, (store.get(K.demoPeople) || []).filter((x) => x.id !== id)); return; }
    const { error } = await sb.from("people").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Render today's page ──────────────────────────────────────
function renderPage() {
  $("#appName").textContent = CONFIG.APP_NAME;
  $("#title").textContent = `Dear Diary – ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;
  $("#theme").textContent = day.theme;
  if (sky) $("#themeWhy").textContent = sky.headline.type === "moon" ? `(the Moon is in ${sky.moon.sign})` : `(${sky.headline.title})`;

  $("#thoughtText").textContent = day.thought.text;
  $("#thoughtMore").textContent = day.thought.more;
  $("#thoughtAsk").textContent = day.thought.ask;

  $("#factText").textContent = day.fact.text;
  $("#factMore").textContent = day.fact.more;

  $("#promptText").textContent = day.prompt.text;
  $("#promptWhy").textContent = day.prompt.why;
  const box = $("#starters");
  box.innerHTML = "";
  day.prompt.starters.forEach((s) => box.append(el("button", { type: "button", className: "starter", textContent: s, onclick: () => insertStarter(s) })));
  ta.placeholder = `Start anywhere… or try: "${day.prompt.starters[0]}"`;

  renderSky();
  if (DEMO) $("#demoBanner").hidden = false;
}

function renderSky() {
  if (!sky) {
    $("#skyHeadline").textContent = "The sky data couldn't load. Check your connection and refresh.";
    return;
  }
  const h = sky.headline;
  const g = h.planet ? Astro.glyph(h.planet) : h.type === "phase" ? ["🌑", "🌓", "🌕", "🌗"][h.quarter] : h.type === "eclipse" ? "🌘" : Astro.SIGNS.find((s) => s.name === sky.moon.sign).glyph;
  $("#skyGlyph").textContent = g;
  $("#skyHeadline").textContent = h.title + (sky.events.length > 1 ? ` · plus ${sky.events.length - 1} more` : "");
  $("#skyExplain").textContent = Astro.explainHeadline(sky);
  const km = Math.round(sky.moon.distanceKm);
  $("#moonLine").textContent = `Tonight's Moon: ${sky.moon.phaseName} in ${sky.moon.sign}, ${Math.round(sky.moon.illumination * 100)}% lit, about ${km.toLocaleString("en-GB")} km away. Its light takes ${(km / 299792).toFixed(2)} seconds to reach you.${sky.retros.length ? ` Retrograde today: ${sky.retros.join(", ")}.` : ""}`;
  const ul = $("#planetList");
  ul.innerHTML = "";
  Astro.PLANETS.forEach((p) => {
    const x = sky.pos[p];
    ul.append(el("li", { textContent: `${Astro.glyph(p)} ${p}: ${x.deg}° ${x.sign.name}${x.retro ? " (retrograde)" : ""}` }));
  });
  if (sky.events.length > 1) {
    ul.append(el("li", { textContent: `Also today: ${sky.events.slice(1).map((e) => e.title).join("; ")}` }));
  }
  renderPersonal();
}

function renderPersonal() {
  const box = $("#personal");
  box.innerHTML = "";
  if (!sky) return;
  if (!user) {
    box.append(el("h3", { textContent: "How does this affect you?" }),
      el("p", { textContent: "Create a free account and add your birth date, time and place to see how today's sky touches your own chart." }),
      el("button", { className: "share-btn plain", type: "button", textContent: "See my reading", onclick: () => { store.set(K.after, "birth"); openAuth("signup", "chart"); } }));
    return;
  }
  const chart = profile && Astro.natalChart(profile);
  if (!chart) {
    box.append(el("h3", { textContent: "Your personal reading" }),
      el("p", { textContent: "Add your birth details to see how today's sky affects your chart." }),
      el("button", { className: "share-btn plain", type: "button", textContent: "Add birth details", onclick: () => openBirth("me") }));
    return;
  }
  const pd = Astro.personalDay(sky, chart);
  const rising = chart.ascSign ? `, Rising ${chart.ascSign.name}` : "";
  box.append(el("h3", { textContent: `For you (Sun ${chart.pos.Sun.sign.name}, Moon ${chart.hasTime ? chart.pos.Moon.sign.name : "?"}${rising})` }));
  if (pd.moonHouse) box.append(el("p", { textContent: `Today's Moon moves through your ${ordinal(pd.moonHouse)} house: the part of your chart about ${Astro.HOUSE_TOPIC[pd.moonHouse]}. ${Astro.MOON_IN[sky.moon.sign]}` }));
  if (pd.notes.length) {
    const ul = el("ul");
    pd.notes.forEach((n) => ul.append(el("li", { textContent: Astro.describeTransit(n) })));
    box.append(ul);
  } else {
    box.append(el("p", { textContent: `No exact links between today's planets and your chart. A quieter day for you: let the Moon in ${sky.moon.sign} set the tone.` }));
  }
  if (!chart.hasTime) box.append(el("p", { className: "fine", textContent: "Add your birth time for your Rising sign, houses and Moon sign." }));
}
const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || "th");

// ── Writing area & drafts (kept for every date until saved) ──
const ta = $("#entry");
const drafts = () => store.get(K.drafts) || {};
function setDraft(date, body) { const d = drafts(); if (body.trim()) d[date] = { body, t: Date.now() }; else delete d[date]; store.set(K.drafts, d); }
function autosize() { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
let cloudTimer;
function onType() {
  autosize();
  setDraft(TODAY, ta.value);
  $("#draftNote").textContent = user ? "Saving your draft…" : "Draft kept on this device.";
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    try { await api.saveDraft(TODAY, ta.value); if (user) $("#draftNote").textContent = "Draft saved to your account."; }
    catch { $("#draftNote").textContent = "Draft kept on this device."; }
  }, 1200);
}
ta.addEventListener("input", onType);
ta.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); });
function insertStarter(text) {
  const sep = ta.value && !ta.value.endsWith("\n") ? "\n\n" : "";
  ta.value += sep + text + " ";
  onType(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}
function restoreDraft() {
  const d = drafts()[TODAY];
  if (d) ta.value = d.body;
  autosize();
  showOldDrafts();
}
function showOldDrafts() {
  const old = Object.entries(drafts()).filter(([date, v]) => date !== TODAY && v.body.trim()).sort();
  const bar = $("#draftBanner");
  if (!old.length) { bar.hidden = true; return; }
  const [date, v] = old[0];
  bar.innerHTML = "";
  bar.append(`You have unsaved writing from ${niceDate(date)}.`,
    el("button", { className: "link", type: "button", textContent: "Save it to my journal", onclick: () => saveEntryFor(date, v.body) }),
    el("button", { className: "link", type: "button", textContent: "Copy it here", onclick: () => { ta.value = (ta.value ? ta.value + "\n\n" : "") + v.body; setDraft(date, ""); onType(); showOldDrafts(); } }));
  bar.hidden = false;
}

async function mergeCloudDrafts() {
  try {
    const cloud = await api.listDrafts();
    const local = drafts();
    for (const c of cloud) {
      const l = local[c.entry_date];
      if (!l || new Date(c.updated_at).getTime() > l.t) local[c.entry_date] = { body: c.body, t: new Date(c.updated_at).getTime() };
    }
    store.set(K.drafts, local);
    if (local[TODAY] && local[TODAY].body !== ta.value && !ta.value.trim()) { ta.value = local[TODAY].body; autosize(); }
    showOldDrafts();
  } catch { /* offline is fine */ }
}

let saving = false;
async function persist(entry) {
  if (saving) return;
  saving = true;
  $("#saveBtn").disabled = true;
  try {
    await api.addEntry(entry);
    store.del(K.pending);
    setDraft(entry.entry_date, "");
    await api.deleteDraft(entry.entry_date).catch(() => {});
    if (entry.entry_date === TODAY) { ta.value = ""; autosize(); }
    $("#draftNote").textContent = "Saved. Your words are kept safely as you type.";
    toast("Saved to your journal ✎");
    showOldDrafts();
  } catch (err) {
    toast("Couldn't save: " + (err.message || "please try again. Your draft is still here."));
  } finally {
    saving = false;
    $("#saveBtn").disabled = false;
  }
}
const entryFor = (date, body) => ({ entry_date: date, theme: day.theme, prompt: date === TODAY ? day.prompt.text : null, body: body.trim() });
async function saveEntryFor(date, body) {
  const entry = entryFor(date, body);
  if (user) return persist(entry);
  store.set(K.pending, entry);
  openAuth("signup", "save");
}
async function save() {
  if (!ta.value.trim()) { ta.classList.add("shake"); ta.focus(); setTimeout(() => ta.classList.remove("shake"), 400); return; }
  saveEntryFor(TODAY, ta.value);
}
$("#saveBtn").onclick = save;

// ── Sign up / log in ─────────────────────────────────────────
let authMode = "signup";
function setAuthMode(mode) {
  authMode = mode;
  const up = mode === "signup";
  const pending = !!store.get(K.pending);
  $("#authSubmit").textContent = up ? (pending ? "Create account & save" : "Create account") : (pending ? "Log in & save" : "Log in");
  $("#switchText").textContent = up ? "Already have an account?" : "New here?";
  $("#switchMode").textContent = up ? "Log in" : "Create an account";
  $("#password").autocomplete = up ? "new-password" : "current-password";
  $("#authErr").hidden = true;
}
function openAuth(mode, reason = "") {
  const titles = { save: "Keep this entry", chart: "Your personal sky", friends: "Add your people", journal: "Start your journal" };
  const msgs = {
    save: "Your words are safe. Create a free account and every entry is kept in your own private journal, organised by date.",
    chart: "Create a free account, then add your birth date, time and place to see how today's sky affects your chart.",
    friends: "Create a free account to add friends and see your compatibility and what's happening between you.",
  };
  $("#authTitle").textContent = titles[reason] || (mode === "signup" ? "Start your journal" : "Welcome back");
  $("#authMsg").textContent = msgs[reason] || "Your journal is private to you, organised by month and searchable.";
  $("#authForm").hidden = false;
  $("#switchRow").hidden = false;
  setAuthMode(mode);
  open("#authModal");
  setTimeout(() => $("#email").focus(), 50);
}
$("#switchMode").onclick = () => setAuthMode(authMode === "signup" ? "login" : "signup");

$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#email").value.trim();
  const password = $("#password").value;
  const err = $("#authErr");
  if (!email || password.length < 6) { err.textContent = "Please enter your email and a password of at least 6 characters."; err.hidden = false; return; }
  $("#authSubmit").disabled = true;
  try {
    if (authMode === "signup") {
      const { needsConfirm } = await api.signUp(email, password);
      if (needsConfirm) {
        $("#authTitle").textContent = "Check your inbox";
        $("#authMsg").textContent = `We've sent a confirmation link to ${email}. Click it and you'll come back here${store.get(K.pending) ? ", and your entry will be saved automatically" : ""}.`;
        $("#authForm").hidden = true;
        $("#switchRow").hidden = true;
        return;
      }
    } else {
      await api.signIn(email, password);
    }
    close("#authModal");
    if (DEMO) onAuthChanged();
  } catch (ex) {
    err.textContent = ex.message || "Something went wrong. Please try again.";
    err.hidden = false;
  } finally {
    $("#authSubmit").disabled = false;
  }
});

async function onAuthChanged() {
  $("#authBtn").textContent = user ? "Sign out" : "Log in";
  $("#authBtn").title = user ? user.email : "";
  if (user) {
    try { profile = await api.getProfile(); } catch { profile = null; }
    try { people = await api.listPeople(); } catch { people = []; }
    const pending = store.get(K.pending);
    if (pending) await persist(pending);
    await mergeCloudDrafts();
    const after = store.get(K.after);
    store.del(K.after);
    if (after === "birth" && !profile) openBirth("me");
    if (after === "friends") openFriends();
  }
  renderPersonal();
  friendsDot();
}

$("#authBtn").onclick = async () => {
  if (user) { await api.signOut(); onAuthChanged(); toast("Signed out"); }
  else openAuth("login");
};

// ── Birth details form (for me, or for a friend) ─────────────
let birthFor = "me";
let picked = null;
function openBirth(forWho) {
  birthFor = forWho;
  picked = null;
  const me = forWho === "me";
  $("#birthTitle").textContent = me ? "Your birth chart" : "Add a person";
  $("#birthMsg").textContent = me
    ? "Your birth date, time and place let Pause show how today's sky touches your own chart. Only you can see this."
    : "Add their birth details to see your compatibility. Only you can see this. Ask them first, it's their information.";
  $("#birthSubmit").textContent = me ? "Save my chart" : "Add person";
  const p = me ? profile : null;
  $("#bName").value = p?.display_name || "";
  $("#bDate").value = p?.birth_date || "";
  $("#bTime").value = p?.birth_time ? p.birth_time.slice(0, 5) : "";
  $("#bNoTime").checked = !!p && !p.birth_time;
  $("#bPlace").value = p?.birth_place || "";
  if (p?.lat != null) picked = { name: p.birth_place, lat: p.lat, lon: p.lon, tz: p.tz };
  $("#placePicked").textContent = picked ? `✓ ${picked.name}` : "";
  $("#placeResults").innerHTML = "";
  $("#birthErr").hidden = true;
  open("#birthModal");
}
$("#bNoTime").onchange = () => { $("#bTime").disabled = $("#bNoTime").checked; if ($("#bNoTime").checked) $("#bTime").value = ""; };
let placeTimer;
$("#bPlace").addEventListener("input", () => {
  picked = null; $("#placePicked").textContent = "";
  clearTimeout(placeTimer);
  const q = $("#bPlace").value.trim();
  if (q.length < 2) { $("#placeResults").innerHTML = ""; return; }
  placeTimer = setTimeout(async () => {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`).then((x) => x.json());
      const box = $("#placeResults");
      box.innerHTML = "";
      (r.results || []).forEach((p) => {
        const name = [p.name, p.admin1, p.country].filter(Boolean).join(", ");
        box.append(el("button", { type: "button", textContent: name, onclick: () => {
          picked = { name, lat: p.latitude, lon: p.longitude, tz: p.timezone };
          $("#bPlace").value = name; box.innerHTML = ""; $("#placePicked").textContent = `✓ ${name}`;
        } }));
      });
      if (!(r.results || []).length) box.append(el("p", { className: "fine", textContent: "No places found. Try the nearest city." }));
    } catch { $("#placeResults").innerHTML = `<p class="fine">Couldn't search places right now.</p>`; }
  }, 350);
});
$("#birthForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#birthErr");
  const date = $("#bDate").value;
  const time = $("#bNoTime").checked ? null : ($("#bTime").value || null);
  if (!date) { err.textContent = "Please add a birth date."; err.hidden = false; return; }
  if (!picked) { err.textContent = "Please choose the birth place from the list (it's needed to work out the time zone)."; err.hidden = false; return; }
  if (birthFor !== "me" && !$("#bName").value.trim()) { err.textContent = "Please add their name."; err.hidden = false; return; }
  const row = { display_name: $("#bName").value.trim() || null, birth_date: date, birth_time: time, birth_place: picked.name, lat: picked.lat, lon: picked.lon, tz: picked.tz };
  $("#birthSubmit").disabled = true;
  try {
    if (birthFor === "me") {
      profile = await api.saveProfile(row);
      close("#birthModal");
      renderPersonal();
      toast("Your chart is ready ✨");
      openChart();
    } else {
      const { display_name, ...rest } = row;
      const person = await api.addPerson({ ...rest, name: display_name });
      people.push(person);
      close("#birthModal");
      openFriends();
    }
  } catch (ex) {
    err.textContent = "Couldn't save: " + (ex.message || "please try again."); err.hidden = false;
  } finally { $("#birthSubmit").disabled = false; }
});

// ── My chart ─────────────────────────────────────────────────
$("#chartBtn").onclick = () => {
  if (!user) { store.set(K.after, "birth"); return openAuth("signup", "chart"); }
  if (!profile) return openBirth("me");
  openChart();
};
function openChart() {
  const chart = Astro.natalChart(profile);
  const body = $("#chartBody");
  body.innerHTML = "";
  if (!chart) return;
  const big = el("div", { className: "chart-big" });
  big.append(
    el("div", {}, el("b", { textContent: `${chart.pos.Sun.sign.glyph} ${chart.pos.Sun.sign.name}` }), el("span", { textContent: "Sun · who you are" })),
    el("div", {}, el("b", { textContent: chart.hasTime ? `${chart.pos.Moon.sign.glyph} ${chart.pos.Moon.sign.name}` : "?" }), el("span", { textContent: chart.hasTime ? "Moon · what you feel" : "Moon · add birth time" })),
    el("div", {}, el("b", { textContent: chart.ascSign ? `${chart.ascSign.glyph} ${chart.ascSign.name}` : "?" }), el("span", { textContent: chart.ascSign ? "Rising · how you show up" : "Rising · add birth time" })));
  const table = el("table", { className: "chart-table" });
  Astro.PLANETS.forEach((p) => {
    const x = chart.pos[p];
    const house = chart.asc != null ? `${ordinal(Astro.wholeSignHouse(x.lon, chart.asc))} house` : "";
    table.append(el("tr", {}, el("td", { textContent: `${Astro.glyph(p)} ${p}` }), el("td", { textContent: `${x.deg}° ${x.sign.name}${x.retro ? " ℞" : ""}` }), el("td", { textContent: house }), el("td", { className: "fine", textContent: Astro.PLANET_MEANING[p] })));
  });
  body.append(
    el("p", { className: "muted", textContent: `Born ${niceDate(profile.birth_date, { day: "numeric", month: "long", year: "numeric" })}${profile.birth_time ? " at " + profile.birth_time.slice(0, 5) : " (time unknown)"} in ${profile.birth_place}.` }),
    big, table,
    el("p", { className: "fine", textContent: "Houses use the whole-sign system. If you don't know your birth time, the Moon's sign may be off by one and the Rising sign can't be calculated." }),
    el("div", { className: "friend-actions" },
      el("button", { className: "share-btn", type: "button", textContent: "Share my big three", onclick: () => openShare("chart") }),
      el("button", { className: "link", type: "button", textContent: "Edit birth details", onclick: () => { close("#chartModal"); openBirth("me"); } })));
  open("#chartModal");
}

// ── Friends & compatibility ──────────────────────────────────
$("#friendsBtn").onclick = () => {
  if (!user) { store.set(K.after, "friends"); return openAuth("signup", "friends"); }
  openFriends();
};
$("#addFriendBtn").onclick = () => { close("#friendsModal"); openBirth("friend"); };
function openFriends() {
  const list = $("#friendsList");
  list.innerHTML = "";
  const me = profile && Astro.natalChart(profile);
  if (!me) {
    list.append(el("p", { className: "empty", textContent: "First add your own birth details, so Pause can compare charts." }),
      el("button", { className: "share-btn", type: "button", textContent: "Add my birth details", onclick: () => { close("#friendsModal"); openBirth("me"); } }));
    open("#friendsModal");
    return;
  }
  if (!people.length) list.append(el("p", { className: "empty", textContent: "No one here yet. Add a friend, partner or family member." }));
  people.forEach((p) => {
    const them = Astro.natalChart(p);
    if (!them) return;
    const c = Astro.compatibility(me, them);
    const card = el("article", { className: "friend" });
    const score = el("div", { className: "score", textContent: c.score });
    score.style.background = c.score >= 70 ? "var(--green)" : c.score >= 50 ? "#C08A2B" : "var(--brown)";
    card.append(el("div", { className: "friend-head" }, score,
      el("div", {}, el("div", { className: "friend-name", textContent: p.name }),
        el("div", { className: "friend-sub", textContent: `${them.pos.Sun.sign.glyph} Sun in ${them.pos.Sun.sign.name}${them.hasTime ? ` · Moon in ${them.pos.Moon.sign.name}` : ""} · ${c.elements[0]} & ${c.elements[1]}` }))));
    const ul = el("ul");
    c.links.slice(0, 4).forEach((l) => ul.append(el("li", { textContent: `${l.good ? "✓" : "⚡"} Your ${l.pa} ${l.aspect.word} their ${l.pb}: ${l.topic} ${l.good ? "comes naturally" : "takes some work"}.` })));
    if (!c.links.length) ul.append(el("li", { textContent: "Few direct links between your charts: you may be very different, which can be its own kind of interesting." }));
    card.append(ul, el("p", { className: "today", textContent: `Today between you: ${sky ? Astro.todayBetween(sky, me, them) : "sky data unavailable."}` }));
    const del = el("button", { className: "del", type: "button", textContent: "Remove" });
    del.onclick = async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again to remove"; return; }
      try { await api.removePerson(p.id); people = people.filter((x) => x.id !== p.id); openFriends(); } catch (ex) { toast("Couldn't remove: " + ex.message); }
    };
    card.append(el("div", { className: "friend-actions" },
      el("button", { className: "share-btn", type: "button", textContent: "Share our match", onclick: () => openShare("match", { person: p, c, me, them }) }), del));
    list.append(card);
  });
  open("#friendsModal");
  friendsDot(true);
}
// A small "something's happening" marker on the Friends tab
function friendsDot(clear = false) {
  const btn = $("#friendsBtn");
  btn.textContent = "Friends";
  if (clear || !user || !sky || !profile || !people.length) return;
  const me = Astro.natalChart(profile);
  const active = people.filter((p) => { const t = Astro.natalChart(p); return t && /touches both/.test(Astro.todayBetween(sky, me, t)); });
  if (active.length) { btn.textContent = "Friends •"; btn.title = `Something's happening today with ${active.map((p) => p.name).join(", ")}`; }
}

// ── My journal ───────────────────────────────────────────────
let entriesCache = [];
$("#journalBtn").onclick = async () => {
  if (!user) return openAuth("signup", "journal");
  open("#journalModal");
  $("#search").value = "";
  $("#entries").innerHTML = `<p class="empty">Opening your journal…</p>`;
  try { entriesCache = await api.listEntries(); renderEntries(); }
  catch (ex) { $("#entries").innerHTML = ""; $("#entries").append(el("p", { className: "empty", textContent: "Couldn't load entries: " + ex.message })); }
};
$("#search").addEventListener("input", renderEntries);
function renderEntries() {
  const q = $("#search").value.trim().toLowerCase();
  const list = entriesCache.filter((e) => !q || [e.body, e.prompt, e.theme].some((t) => (t || "").toLowerCase().includes(q)));
  const box = $("#entries");
  box.innerHTML = "";
  $("#journalMeta").textContent = `${entriesCache.length} entr${entriesCache.length === 1 ? "y" : "ies"} · ${user.email}`;
  if (!list.length) { box.innerHTML = `<p class="empty">${entriesCache.length ? "No entries match that search." : "Your first page is waiting. Today's journal idea is a good place to start."}</p>`; return; }
  let lastMonth = "";
  list.forEach((e) => {
    const month = parseISO(e.entry_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (month !== lastMonth) { box.append(el("h3", { className: "month", textContent: month })); lastMonth = month; }
    const card = el("article", { className: "entry" });
    const left = el("div", {}, el("span", { className: "entry-date", textContent: niceDate(e.entry_date) }));
    if (e.theme) left.append(el("span", { className: "entry-theme", textContent: e.theme }));
    const del = el("button", { className: "del", type: "button", textContent: "Delete" });
    del.onclick = async (ev) => {
      ev.stopPropagation();
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again to delete"; return; }
      try { await api.removeEntry(e.id); entriesCache = entriesCache.filter((x) => x.id !== e.id); renderEntries(); } catch (ex) { toast("Couldn't delete: " + ex.message); }
    };
    const body = el("p", { className: "entry-body", textContent: e.body, title: "Tap to read the whole entry", onclick: () => card.classList.toggle("expanded") });
    card.append(el("div", { className: "entry-head" }, left, del), el("p", { className: "entry-prompt", textContent: e.prompt || "" }), body);
    box.append(card);
  });
}
$("#signOutBtn").onclick = async () => { await api.signOut(); close("#journalModal"); onAuthChanged(); toast("Signed out"); };

// ── Sharing ──────────────────────────────────────────────────
function shareContent(kind, extra) {
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  switch (kind) {
    case "thought": return { label: "Food for Thought", main: day.thought.text, sub: day.thought.ask, text: `${day.thought.text}\n\n${day.thought.ask}` };
    case "fact": return { label: "Random Fact of the Day", main: day.fact.text, sub: "Wait, really?", text: `Did you know? ${day.fact.text}` };
    case "sky": return { label: `Today in the Sky · ${date}`, main: sky ? sky.headline.title : "", sub: sky ? `Moon in ${sky.moon.sign} · ${sky.moon.phaseName}` : "", text: sky ? `Today in the sky: ${sky.headline.title}. ${Astro.explainHeadline(sky)}` : "" };
    case "chart": {
      const c = Astro.natalChart(profile);
      const three = `Sun in ${c.pos.Sun.sign.name}${c.hasTime ? `, Moon in ${c.pos.Moon.sign.name}` : ""}${c.ascSign ? `, ${c.ascSign.name} Rising` : ""}`;
      return { label: "My Big Three", main: three, sub: "What's yours?", text: `My big three: ${three}. What's yours?` };
    }
    case "match": {
      const { person, c, me, them } = extra;
      return { label: "Our Cosmic Match", main: `${me.pos.Sun.sign.glyph} ${me.pos.Sun.sign.name} + ${them.pos.Sun.sign.glyph} ${them.pos.Sun.sign.name}: ${c.score}%`, sub: `Me & ${person.name}`, text: `${person.name} and I are a ${c.score}% cosmic match (${me.pos.Sun.sign.name} + ${them.pos.Sun.sign.name}). Check yours:` };
    }
    default: return { label: "Pause", main: "A daily diary for your mind", sub: "Food for thought, today's sky, a fact worth sharing and a journal idea that helps.", text: "I've been using Pause, a daily diary for your mind. A new page every day:" };
  }
}

async function makeCard(c) {
  try { await document.fonts.ready; } catch { /* ignore */ }
  const W = 1080, H = 1350, LH = 76, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  x.fillStyle = "#E9DFCF"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#FFFDF7"; roundRect(x, 50, 50, W - 100, H - 100, 14); x.fill();
  // ruled lines + red margin, like a diary page
  x.strokeStyle = "#DCE6EE"; x.lineWidth = 2;
  for (let y = 380; y < H - 230; y += LH) { x.beginPath(); x.moveTo(50, y + 14); x.lineTo(W - 50, y + 14); x.stroke(); }
  x.strokeStyle = "#E9A8A0"; x.lineWidth = 3; x.beginPath(); x.moveTo(120, 300); x.lineTo(120, H - 230); x.stroke();
  // washi-tape label
  x.font = "700 40px Kalam, cursive";
  const tw = x.measureText(c.label).width + 60;
  x.save(); x.translate(150, 120); x.rotate(-0.025); x.fillStyle = "rgba(232,196,112,.6)"; x.fillRect(0, 0, tw, 66); x.restore();
  x.fillStyle = "#8B3A17"; x.fillText(c.label, 180, 168);
  x.fillStyle = "#6B7A3A"; x.font = "70px 'Shadows Into Light', cursive"; x.fillText("Dear Diary…", 150, 280);
  // main text sits on the lines
  const size = c.main.length > 150 ? 44 : c.main.length > 90 ? 50 : c.main.length > 50 ? 58 : 68;
  x.fillStyle = "#3A3330"; x.font = `800 ${size}px Nunito, sans-serif`;
  let y = wrap(x, c.main, 150, 380, W - 260, LH);
  if (c.sub) { x.fillStyle = "#2E3A59"; x.font = "44px Kalam, cursive"; wrap(x, c.sub, 150, y + LH * 1.5, W - 260, LH); }
  // footer
  x.fillStyle = "#8B3A17"; x.font = "76px 'Shadows Into Light', cursive"; x.fillText(CONFIG.APP_NAME, 150, H - 130);
  x.fillStyle = "#857A70"; x.font = "30px Nunito, sans-serif"; x.fillText("a daily diary for your mind · " + SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, ""), 150, H - 82);
  return new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function wrap(x, text, left, top, maxW, lh) {
  const words = text.split(/\s+/); let line = ""; let y = top;
  for (const w of words) { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { x.fillText(line, left, y); line = w; y += lh; } else line = t; }
  if (line) x.fillText(line, left, y);
  return y;
}

async function openShare(kind, extra) {
  const c = shareContent(kind, extra);
  const text = c.text;
  const url = SITE_URL;
  const full = `${text}\n${url}`;
  const grid = $("#shareGrid");
  grid.innerHTML = "";
  $("#shareImg").removeAttribute("src");
  open("#shareModal");
  const blob = await makeCard(c);
  const file = blob ? new File([blob], "pause.png", { type: "image/png" }) : null;
  if (blob) $("#shareImg").src = URL.createObjectURL(blob);
  const enc = encodeURIComponent;
  if (navigator.share) {
    grid.append(el("button", { className: "wide", type: "button", textContent: "Share… (Instagram, WhatsApp, Messages)", onclick: async () => {
      try {
        if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: full });
        else await navigator.share({ title: CONFIG.APP_NAME, text, url });
      } catch { /* user cancelled */ }
    } }));
  }
  const links = [
    ["WhatsApp", `https://wa.me/?text=${enc(full)}`],
    ["X / Twitter", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ["Telegram", `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`],
    ["Email", `mailto:?subject=${enc(CONFIG.APP_NAME + " · " + c.label)}&body=${enc(full)}`],
  ];
  links.forEach(([name, href]) => grid.append(el("a", { href, target: "_blank", rel: "noopener", textContent: name })));
  grid.append(el("button", { type: "button", textContent: "Copy text", onclick: async () => { try { await navigator.clipboard.writeText(full); toast("Copied"); } catch { toast("Couldn't copy"); } } }));
  if (blob) {
    const a = el("a", { href: URL.createObjectURL(blob), download: "pause.png", textContent: "Save image" });
    a.title = "Save the image to post it on Instagram or TikTok";
    grid.append(a);
  }
}
document.querySelectorAll("[data-share]").forEach((b) => (b.onclick = () => openShare(b.dataset.share)));
$("#shareAppBtn").onclick = () => openShare("app");

// ── Install as an app ────────────────────────────────────────
let installEvent = null;
const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; $("#installBtn").hidden = false; });
if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) $("#installBtn").hidden = false;
$("#installBtn").onclick = async () => {
  if (installEvent) { installEvent.prompt(); await installEvent.userChoice.catch(() => {}); installEvent = null; $("#installBtn").hidden = true; }
  else open("#installModal");
};
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

// ── Modal + toast helpers ────────────────────────────────────
function open(sel) { $(sel).hidden = false; }
function close(sel) { $(sel).hidden = true; }
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m || e.target.hasAttribute("data-close")) m.hidden = true; }));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".modal:not([hidden])").forEach((m) => (m.hidden = true)); });
let toastTimer;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600); }

// ── Start ────────────────────────────────────────────────────
renderPage();
restoreDraft();
api.init()
  .then(onAuthChanged)
  .catch(() => toast("Couldn't connect to the journal service. You can keep writing: your draft is kept on this device."));

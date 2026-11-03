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
  drafts: "pause_drafts", pending: "pause_pending", after: "pause_after_auth", invite: "pause_invite", knownFriends: "pause_known_friends",
  demoUser: "pause_demo_user", demoEntries: "pause_demo_entries", demoProfile: "pause_demo_profile",
};
try { navigator.storage?.persist?.(); } catch { /* ignore */ }

// ── Dates ────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const niceDate = (s, opts = { weekday: "long", day: "numeric", month: "long" }) => parseISO(s).toLocaleDateString("en-GB", opts);
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoDate(d); };
const dayNum = (iso) => { const d = parseISO(iso); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); };
const TODAY = isoDate();
const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || "th");

// ── Backend ──────────────────────────────────────────────────
const DEMO = !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;
let sb = null, user = null, profile = null, friends = [];

const api = {
  async init() {
    if (DEMO) { user = store.get(K.demoUser); return; }
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    user = data.session?.user ?? null;
    sb.auth.onAuthStateChange((_e, session) => {
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
  async signOut() { if (DEMO) store.del(K.demoUser); else await sb.auth.signOut(); user = null; profile = null; friends = []; },
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
  async saveDraft(date, body) {
    if (DEMO || !user) return;
    if (!body.trim()) { await sb.from("drafts").delete().eq("entry_date", date); return; }
    await sb.from("drafts").upsert({ user_id: user.id, entry_date: date, body, updated_at: new Date().toISOString() }, { onConflict: "user_id,entry_date" });
  },
  async listDrafts() { if (DEMO || !user) return []; const { data } = await sb.from("drafts").select("entry_date, body, updated_at"); return data || []; },
  async deleteDraft(date) { if (!DEMO && user) await sb.from("drafts").delete().eq("entry_date", date); },
  async getProfile() {
    if (DEMO) return store.get(K.demoProfile);
    const { data } = await sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    return data;
  },
  async saveProfile(p) {
    if (DEMO) { store.set(K.demoProfile, p); return p; }
    const { data, error } = await sb.from("profiles").upsert({ ...p, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select().single();
    if (error) throw error;
    return data;
  },
  // Friends = accepted invites only
  async listFriends() {
    if (DEMO) return [];
    const { data: rows, error } = await sb.from("friendships").select("*");
    if (error) throw error;
    const ids = rows.map((r) => (r.user_a === user.id ? r.user_b : r.user_a));
    if (!ids.length) return [];
    const { data: profs } = await sb.from("profiles").select("*").in("user_id", ids);
    return ids.map((id) => ({ user_id: id, ...(profs || []).find((p) => p.user_id === id) }));
  },
  async createInvite() {
    if (DEMO) throw new Error("Invites work on the live site once you're signed in.");
    const code = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
    const { error } = await sb.from("invites").insert({ code, inviter_name: profile?.display_name || null });
    if (error) throw error;
    return code;
  },
  async getInvite(code) {
    if (DEMO) return null;
    const { data, error } = await sb.rpc("get_invite", { p_code: code });
    if (error) throw error;
    return (data || [])[0] || null;
  },
  async acceptInvite(code) { const { data, error } = await sb.rpc("accept_invite", { p_code: code }); if (error) throw error; return data; },
  async removeFriend(id) {
    const [a, b] = [user.id, id].sort();
    const { error } = await sb.from("friendships").delete().eq("user_a", a).eq("user_b", b);
    if (error) throw error;
  },
};

// ── Building one diary page for any date ─────────────────────
const skyCache = {};
function skyFor(iso) {
  if (!(iso in skyCache)) { try { skyCache[iso] = Astro.skyForDay(parseISO(iso)); } catch (e) { console.warn(e); skyCache[iso] = null; } }
  return skyCache[iso];
}
const myChart = () => (profile ? Astro.natalChart(profile) : null);

function buildDay(iso) {
  const n = dayNum(iso);
  const sky = skyFor(iso);
  const chart = myChart();
  let theme = sky?.theme, why = "", personal = null;
  if (sky && chart) {
    personal = Astro.personalTheme(sky, chart);
    theme = personal.theme;
    why = `${sky.headline.title}, in your ${ordinal(personal.house)} house of ${Astro.HOUSE_SHORT[personal.house]}`;
  } else if (sky) {
    why = sky.headline.type === "moon" ? `the Moon is in ${sky.moon.sign}` : sky.headline.title;
  }
  const themes = Object.keys(THOUGHTS);
  if (!THOUGHTS[theme]) theme = themes[n % themes.length];
  const pick = (arr, o = 0) => arr[(n + o) % arr.length];
  return { iso, sky, theme, why, personal, thought: pick(THOUGHTS[theme]), prompt: pick(PROMPTS[theme]), fact: pick(FACTS, 6) };
}

let viewISO = TODAY;
let day = buildDay(viewISO);

// ── Render ───────────────────────────────────────────────────
function renderPage() {
  day = buildDay(viewISO);
  $("#appName").textContent = CONFIG.APP_NAME;
  $("#title").textContent = parseISO(viewISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#theme").textContent = day.theme;
  $("#themeWhy").textContent = day.why ? `(${day.why})` : "";

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

  renderStrip();
  renderSky();
  renderWriter();
  if (DEMO) $("#demoBanner").hidden = false;
}

function renderStrip() {
  const strip = $("#dayStrip");
  strip.innerHTML = "";
  for (let i = -5; i <= 5; i++) {
    const iso = addDays(TODAY, i);
    const d = parseISO(iso);
    const b = el("button", { type: "button", className: "day" + (iso === viewISO ? " on" : "") + (i === 0 ? " today" : "") + (i > 0 ? " future" : ""), title: niceDate(iso) },
      el("span", { textContent: i === 0 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" }) }), el("b", { textContent: d.getDate() }));
    b.onclick = () => { viewISO = iso; renderPage(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    strip.append(b);
  }
}

function renderSky() {
  const sky = day.sky;
  if (!sky) { $("#skyHeadline").textContent = "The sky data couldn't load. Check your connection and refresh."; $("#personal").innerHTML = ""; return; }
  const h = sky.headline;
  $("#skyGlyph").textContent = h.planet ? Astro.glyph(h.planet) : h.type === "phase" ? ["🌑", "🌓", "🌕", "🌗"][h.quarter] : h.type === "eclipse" ? "🌘" : Astro.SIGNS.find((s) => s.name === sky.moon.sign).glyph;
  $("#skyHeadline").textContent = h.title + (sky.events.length > 1 ? ` · plus ${sky.events.length - 1} more` : "");
  $("#skyExplain").textContent = Astro.explainHeadline(sky);
  const km = Math.round(sky.moon.distanceKm);
  const when = viewISO === TODAY ? "Tonight's" : viewISO < TODAY ? "That night's" : "That night's";
  $("#moonLine").textContent = `${when} Moon: ${sky.moon.phaseName} in ${sky.moon.sign}, ${Math.round(sky.moon.illumination * 100)}% lit, about ${km.toLocaleString("en-GB")} km away. Its light takes ${(km / 299792).toFixed(2)} seconds to reach you.${sky.retros.length ? ` Retrograde: ${sky.retros.join(", ")}.` : ""}`;
  const ul = $("#planetList");
  ul.innerHTML = "";
  Astro.PLANETS.forEach((p) => { const x = sky.pos[p]; ul.append(el("li", { textContent: `${Astro.glyph(p)} ${p}: ${x.deg}° ${x.sign.name}${x.retro ? " (retrograde)" : ""}` })); });
  if (sky.events.length > 1) ul.append(el("li", { textContent: `Also: ${sky.events.slice(1).map((e) => e.title).join("; ")}` }));
  renderPersonal();
}

function renderPersonal() {
  const box = $("#personal");
  box.innerHTML = "";
  const sky = day.sky;
  if (!sky) return;
  if (!user) {
    box.append(el("h3", { textContent: "How does this affect you?" }),
      el("p", { textContent: "Create a free account and add your birth date, time and place. Your daily theme and reading will then come from where today's sky lands in your own chart." }),
      el("button", { className: "share-btn", type: "button", textContent: "See my reading", onclick: () => { store.set(K.after, "birth"); openAuth("signup", "chart"); } }));
    return;
  }
  const chart = myChart();
  if (!chart) {
    box.append(el("h3", { textContent: "Your personal reading" }),
      el("p", { textContent: "Add your birth details to make your daily theme and reading personal." }),
      el("button", { className: "share-btn", type: "button", textContent: "Add birth details", onclick: () => openBirth() }));
    return;
  }
  const pd = Astro.personalDay(sky, chart);
  const rising = chart.ascSign ? `, Rising ${chart.ascSign.name}` : "";
  box.append(el("h3", { textContent: `For you (Sun ${chart.pos.Sun.sign.name}, Moon ${chart.hasTime ? chart.pos.Moon.sign.name : "?"}${rising})` }));
  if (day.personal) box.append(el("p", { textContent: `${sky.headline.title} lands in your ${ordinal(day.personal.house)} house, the part of your chart about ${Astro.HOUSE_TOPIC[day.personal.house]}. That's why your theme ${viewISO === TODAY ? "today" : "for this day"} is "${day.theme}".${day.personal.solar ? " (Without a birth time, houses are counted from your Sun sign.)" : ""}` }));
  if (pd.moonHouse && sky.headline.type !== "moon" && sky.headline.planet !== "Moon") box.append(el("p", { textContent: `The Moon itself is in your ${ordinal(pd.moonHouse)} house: ${Astro.MOON_IN[sky.moon.sign]}` }));
  if (pd.notes.length) { const ul = el("ul"); pd.notes.forEach((n) => ul.append(el("li", { textContent: Astro.describeTransit(n) }))); box.append(ul); }
  else box.append(el("p", { textContent: `No exact links between the planets and your chart${viewISO === TODAY ? " today" : " on this day"}. A quieter day: let the Moon in ${sky.moon.sign} set the tone.` }));
}

// ── Writing area & drafts (kept for every date until saved) ──
const ta = $("#entry");
const drafts = () => store.get(K.drafts) || {};
function setDraft(date, body) { const d = drafts(); if (body.trim()) d[date] = { body, t: Date.now() }; else delete d[date]; store.set(K.drafts, d); }
function autosize() { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
function renderWriter() {
  const future = viewISO > TODAY;
  ta.disabled = future;
  $("#saveBtn").disabled = future;
  ta.value = future ? "" : (drafts()[viewISO]?.body || "");
  ta.placeholder = future ? `This page opens on ${niceDate(viewISO)}. Come back then to write.` : `Start anywhere… or try: "${day.prompt.starters[0]}"`;
  $("#draftNote").textContent = future ? "A sneak peek of a page that hasn't opened yet." : viewISO < TODAY ? `Writing for ${niceDate(viewISO)}.` : "Your words are kept safely as you type.";
  autosize();
}
let cloudTimer;
function onType() {
  autosize();
  const date = viewISO;
  setDraft(date, ta.value);
  $("#draftNote").textContent = user ? "Saving your draft…" : "Draft kept on this device.";
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    try { await api.saveDraft(date, ta.value); if (user) $("#draftNote").textContent = "Draft saved to your account."; }
    catch { $("#draftNote").textContent = "Draft kept on this device."; }
  }, 1200);
}
ta.addEventListener("input", onType);
ta.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); });
function insertStarter(text) {
  if (ta.disabled) return;
  const sep = ta.value && !ta.value.endsWith("\n") ? "\n\n" : "";
  ta.value += sep + text + " ";
  onType(); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}
function showOldDrafts() {
  const old = Object.entries(drafts()).filter(([date, v]) => date < addDays(TODAY, -5) && v.body.trim()).sort();
  const bar = $("#draftBanner");
  if (!old.length) { bar.hidden = true; return; }
  const [date, v] = old[0];
  bar.innerHTML = "";
  bar.append(`You have unsaved writing from ${niceDate(date)}.`,
    el("button", { className: "link", type: "button", textContent: "Save it to my journal", onclick: () => saveEntryFor(date, v.body, null) }));
  bar.hidden = false;
}
async function mergeCloudDrafts() {
  try {
    const cloud = await api.listDrafts();
    const local = drafts();
    for (const c of cloud) { const l = local[c.entry_date]; if (!l || new Date(c.updated_at).getTime() > l.t) local[c.entry_date] = { body: c.body, t: new Date(c.updated_at).getTime() }; }
    store.set(K.drafts, local);
    if (!ta.value.trim() && local[viewISO] && viewISO <= TODAY) { ta.value = local[viewISO].body; autosize(); }
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
    if (entry.entry_date === viewISO) { ta.value = ""; autosize(); }
    $("#draftNote").textContent = "Saved to your journal.";
    toast("Saved to your journal ✎");
    showOldDrafts();
  } catch (err) {
    toast("Couldn't save: " + (err.message || "please try again. Your draft is still here."));
  } finally { saving = false; $("#saveBtn").disabled = viewISO > TODAY; }
}
function saveEntryFor(date, body, prompt) {
  const entry = { entry_date: date, theme: date === viewISO ? day.theme : null, prompt, body: body.trim() };
  if (user) return persist(entry);
  store.set(K.pending, entry);
  openAuth("signup", "save");
}
function save() {
  if (viewISO > TODAY) return;
  if (!ta.value.trim()) { ta.classList.add("shake"); ta.focus(); setTimeout(() => ta.classList.remove("shake"), 400); return; }
  saveEntryFor(viewISO, ta.value, day.prompt.text);
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
  const titles = { save: "Keep this entry", chart: "Your personal sky", friends: "Add your people", journal: "Start your journal", invite: "Accept the invite" };
  const msgs = {
    save: "Your words are safe. Create a free account and every entry is kept in your own private journal, organised by date.",
    chart: "Create a free account, then add your birth date, time and place to make your daily page personal.",
    friends: "Create a free account to invite friends and see your compatibility.",
    invite: "Create a free account (or log in), then add your birth details to see your compatibility.",
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
  const email = $("#email").value.trim(), password = $("#password").value, err = $("#authErr");
  if (!email || password.length < 6) { err.textContent = "Please enter your email and a password of at least 6 characters."; err.hidden = false; return; }
  $("#authSubmit").disabled = true;
  try {
    if (authMode === "signup") {
      const { needsConfirm } = await api.signUp(email, password);
      if (needsConfirm) {
        $("#authTitle").textContent = "Check your inbox";
        $("#authMsg").textContent = `We've sent a confirmation link to ${email}. Click it and you'll come back here${store.get(K.pending) ? ", and your entry will be saved automatically" : ""}${store.get(K.invite) ? ", and you can finish accepting the invite" : ""}.`;
        $("#authForm").hidden = true; $("#switchRow").hidden = true;
        return;
      }
    } else await api.signIn(email, password);
    close("#authModal");
    if (DEMO) onAuthChanged();
  } catch (ex) { err.textContent = ex.message || "Something went wrong. Please try again."; err.hidden = false; }
  finally { $("#authSubmit").disabled = false; }
});

async function onAuthChanged() {
  $("#authBtn").textContent = user ? "Sign out" : "Log in";
  $("#authBtn").title = user ? user.email : "";
  if (user) {
    try { profile = await api.getProfile(); } catch { profile = null; }
    await loadFriends();
    const pending = store.get(K.pending);
    if (pending) await persist(pending);
    await mergeCloudDrafts();
    const after = store.get(K.after);
    store.del(K.after);
    if (store.get(K.invite)) { if (store.get(K.invite + "_ok")) continueInvite(); else showInvite(); }
    else if (after === "birth" && !profile) openBirth();
    else if (after === "friends") openFriends();
  } else friends = [];
  renderPage();
  friendsDot();
}
$("#authBtn").onclick = async () => { if (user) { await api.signOut(); onAuthChanged(); toast("Signed out"); } else openAuth("login"); };

// ── Birth details ────────────────────────────────────────────
let picked = null;
function openBirth() {
  picked = null;
  $("#birthTitle").textContent = "Your birth chart";
  $("#birthMsg").textContent = store.get(K.invite)
    ? "Last step: add your birth details so you and your friend can see your compatibility. Your friends will be able to see your chart."
    : "Your birth date, time and place make your daily theme and reading personal. Only you and friends you accept can see this.";
  const p = profile;
  $("#bName").value = p?.display_name || "";
  $("#bDate").value = p?.birth_date || "";
  $("#bTime").value = p?.birth_time ? p.birth_time.slice(0, 5) : "";
  $("#bNoTime").checked = !!p && !p.birth_time;
  $("#bTime").disabled = $("#bNoTime").checked;
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
        box.append(el("button", { type: "button", textContent: name, onclick: () => { picked = { name, lat: p.latitude, lon: p.longitude, tz: p.timezone }; $("#bPlace").value = name; box.innerHTML = ""; $("#placePicked").textContent = `✓ ${name}`; } }));
      });
      if (!(r.results || []).length) box.append(el("p", { className: "fine", textContent: "No places found. Try the nearest city." }));
    } catch { $("#placeResults").innerHTML = `<p class="fine">Couldn't search places right now.</p>`; }
  }, 350);
});
$("#birthForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#birthErr");
  const name = $("#bName").value.trim(), date = $("#bDate").value, time = $("#bNoTime").checked ? null : ($("#bTime").value || null);
  if (!name) { err.textContent = "Please add your name (friends will see it)."; err.hidden = false; return; }
  if (!date) { err.textContent = "Please add a birth date."; err.hidden = false; return; }
  if (!picked) { err.textContent = "Please choose the birth place from the list (it's needed to work out the time zone)."; err.hidden = false; return; }
  $("#birthSubmit").disabled = true;
  try {
    profile = await api.saveProfile({ display_name: name, birth_date: date, birth_time: time, birth_place: picked.name, lat: picked.lat, lon: picked.lon, tz: picked.tz });
    close("#birthModal");
    renderPage();
    if (store.get(K.invite) && store.get(K.invite + "_ok")) return continueInvite();
    toast("Your chart is ready ✨");
    openChart();
  } catch (ex) { err.textContent = "Couldn't save: " + (ex.message || "please try again."); err.hidden = false; }
  finally { $("#birthSubmit").disabled = false; }
});

// ── My chart ─────────────────────────────────────────────────
$("#chartBtn").onclick = () => {
  if (!user) { store.set(K.after, "birth"); return openAuth("signup", "chart"); }
  if (!profile) return openBirth();
  openChart();
};
function openChart() {
  const chart = myChart();
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
    el("p", { className: "muted", textContent: `${profile.display_name ? profile.display_name + ", born " : "Born "}${niceDate(profile.birth_date, { day: "numeric", month: "long", year: "numeric" })}${profile.birth_time ? " at " + profile.birth_time.slice(0, 5) : " (time unknown)"} in ${profile.birth_place}.` }),
    big, table,
    el("p", { className: "fine", textContent: "Houses use the whole-sign system. Without a birth time, the Moon's sign may be off by one and the Rising sign can't be calculated." }),
    el("div", { className: "friend-actions" },
      el("button", { className: "share-btn", type: "button", textContent: "Share my big three", onclick: () => openShare("chart") }),
      el("button", { className: "link", type: "button", textContent: "Edit birth details", onclick: () => { close("#chartModal"); openBirth(); } })));
  open("#chartModal");
}

// ── Friends: invite → they accept → you're friends ───────────
async function loadFriends() {
  try { friends = await api.listFriends(); } catch { friends = []; }
  const known = store.get(K.knownFriends) || [];
  const fresh = friends.filter((f) => !known.includes(f.user_id));
  if (known.length && fresh.length) toast(`${fresh.map((f) => f.display_name || "A friend").join(", ")} accepted your invite! Open Friends to see your match.`);
  store.set(K.knownFriends, friends.map((f) => f.user_id));
}
$("#friendsBtn").onclick = () => { if (!user) { store.set(K.after, "friends"); return openAuth("signup", "friends"); } openFriends(); };
$("#addFriendBtn").onclick = async () => {
  if (!profile) { close("#friendsModal"); return openBirth(); }
  try {
    const code = await api.createInvite();
    openShare("invite", { url: `${SITE_URL}?invite=${code}` });
  } catch (ex) { toast(ex.message || "Couldn't create an invite."); }
};
function openFriends() {
  const list = $("#friendsList");
  list.innerHTML = "";
  const me = myChart();
  if (!me) {
    list.append(el("p", { className: "empty", textContent: "First add your own birth details, so Pause can compare charts." }),
      el("button", { className: "share-btn", type: "button", textContent: "Add my birth details", onclick: () => { close("#friendsModal"); openBirth(); } }));
    open("#friendsModal");
    return;
  }
  if (!friends.length) list.append(el("p", { className: "empty", textContent: "No friends yet. Send an invite: once they accept and add their birth details, they'll appear here." }));
  friends.forEach((f) => {
    const them = f.birth_date ? Astro.natalChart(f) : null;
    const card = el("article", { className: "friend" });
    if (!them) {
      card.append(el("div", { className: "friend-name", textContent: f.display_name || "Your friend" }), el("p", { className: "fine", textContent: "They've accepted, but haven't added their birth details yet." }));
      list.append(card);
      return;
    }
    const c = Astro.compatibility(me, them);
    const score = el("div", { className: "score", textContent: c.score });
    score.style.background = c.score >= 70 ? "var(--green)" : c.score >= 50 ? "#C08A2B" : "var(--brown)";
    card.append(el("div", { className: "friend-head" }, score,
      el("div", {}, el("div", { className: "friend-name", textContent: f.display_name || "Your friend" }),
        el("div", { className: "friend-sub", textContent: `${them.pos.Sun.sign.glyph} Sun in ${them.pos.Sun.sign.name}${them.hasTime ? ` · Moon in ${them.pos.Moon.sign.name}` : ""} · ${c.elements[0]} & ${c.elements[1]}` }))));
    const ul = el("ul");
    c.links.slice(0, 4).forEach((l) => ul.append(el("li", { textContent: `${l.good ? "✓" : "⚡"} Your ${l.pa} ${l.aspect.word} their ${l.pb}: ${l.topic} ${l.good ? "comes naturally" : "takes some work"}.` })));
    if (!c.links.length) ul.append(el("li", { textContent: "Few direct links between your charts: you may be very different, which can be its own kind of interesting." }));
    const sky = skyFor(TODAY);
    card.append(ul, el("p", { className: "today", textContent: `Today between you: ${sky ? Astro.todayBetween(sky, me, them) : "sky data unavailable."}` }));
    const del = el("button", { className: "del", type: "button", textContent: "Remove friend" });
    del.onclick = async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again to remove"; return; }
      try { await api.removeFriend(f.user_id); friends = friends.filter((x) => x.user_id !== f.user_id); store.set(K.knownFriends, friends.map((x) => x.user_id)); openFriends(); } catch (ex) { toast("Couldn't remove: " + ex.message); }
    };
    card.append(el("div", { className: "friend-actions" }, el("button", { className: "share-btn", type: "button", textContent: "Share our match", onclick: () => openShare("match", { f, c, me, them }) }), del));
    list.append(card);
  });
  open("#friendsModal");
  friendsDot(true);
}
function friendsDot(clear = false) {
  const btn = $("#friendsBtn");
  btn.textContent = "Friends";
  const sky = skyFor(TODAY), me = myChart();
  if (clear || !user || !sky || !me || !friends.length) return;
  const active = friends.filter((f) => { const t = f.birth_date && Astro.natalChart(f); return t && /touches both/.test(Astro.todayBetween(sky, me, t)); });
  if (active.length) { btn.textContent = "Friends •"; btn.title = `Something's happening today with ${active.map((f) => f.display_name).join(", ")}`; }
}

// Arriving through an invite link
const urlInvite = new URLSearchParams(location.search).get("invite");
if (urlInvite) { store.set(K.invite, urlInvite); history.replaceState(null, "", SITE_URL); }
async function showInvite() {
  const code = store.get(K.invite);
  if (!code) return;
  let inv = null;
  try { inv = await api.getInvite(code); } catch { /* ignore */ }
  if (!inv) { store.del(K.invite); return toast("That invite link isn't valid any more."); }
  if (inv.accepted) { store.del(K.invite); return toast("That invite has already been used. Ask your friend for a new one."); }
  if (inv.is_mine) { store.del(K.invite); return toast("That's your own invite link. Send it to a friend!"); }
  const name = inv.inviter_name || "A friend";
  $("#inviteTitle").textContent = `${name} invited you`;
  $("#inviteMsg").textContent = `${name} wants to be friends on Pause, a daily diary for your mind. Accept to see your cosmic compatibility and what's happening between you two each day. You'll be able to see each other's birth charts.`;
  open("#inviteModal");
}
$("#inviteAccept").onclick = () => { store.set(K.invite + "_ok", true); close("#inviteModal"); continueInvite(); };
$("#inviteDecline").onclick = () => { store.del(K.invite); store.del(K.invite + "_ok"); close("#inviteModal"); };
async function continueInvite() {
  const code = store.get(K.invite);
  if (!code) return;
  if (!user) return openAuth("signup", "invite");
  if (!profile) return openBirth();
  try {
    const name = await api.acceptInvite(code);
    store.del(K.invite); store.del(K.invite + "_ok");
    await loadFriends();
    toast(`You and ${name || "your friend"} are now friends ✨`);
    openFriends();
  } catch (ex) { store.del(K.invite); store.del(K.invite + "_ok"); toast(ex.message || "Couldn't accept the invite."); }
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
    card.append(el("div", { className: "entry-head" }, left, del), el("p", { className: "entry-prompt", textContent: e.prompt || "" }),
      el("p", { className: "entry-body", textContent: e.body, title: "Tap to read the whole entry", onclick: () => card.classList.toggle("expanded") }));
    box.append(card);
  });
}
$("#signOutBtn").onclick = async () => { await api.signOut(); close("#journalModal"); onAuthChanged(); toast("Signed out"); };

// ── Sharing ──────────────────────────────────────────────────
function shareContent(kind, extra = {}) {
  const date = parseISO(viewISO).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const sky = day.sky;
  switch (kind) {
    case "thought": return { label: "Food for Thought", main: day.thought.text, sub: day.thought.ask, text: `${day.thought.text}\n\n${day.thought.ask}` };
    case "fact": return { label: "Random Fact of the Day", main: day.fact.text, sub: "Wait, really?", text: `Did you know? ${day.fact.text}` };
    case "sky": return { label: `Today in the Sky · ${date}`, main: sky ? sky.headline.title : "", sub: sky ? `Moon in ${sky.moon.sign} · ${sky.moon.phaseName}` : "", text: sky ? `${sky.headline.title}. ${Astro.explainHeadline(sky)}` : "" };
    case "chart": {
      const c = myChart();
      const three = `Sun in ${c.pos.Sun.sign.name}${c.hasTime ? `, Moon in ${c.pos.Moon.sign.name}` : ""}${c.ascSign ? `, ${c.ascSign.name} Rising` : ""}`;
      return { label: "My Big Three", main: three, sub: "What's yours?", text: `My big three: ${three}. What's yours?` };
    }
    case "match": {
      const { f, c, me, them } = extra;
      return { label: "Our Cosmic Match", main: `${me.pos.Sun.sign.glyph} ${me.pos.Sun.sign.name} + ${them.pos.Sun.sign.glyph} ${them.pos.Sun.sign.name}: ${c.score}%`, sub: `Me & ${f.display_name || "my friend"}`, text: `${f.display_name || "My friend"} and I are a ${c.score}% cosmic match (${me.pos.Sun.sign.name} + ${them.pos.Sun.sign.name}). Check yours:` };
    }
    case "invite": return { label: "You're invited", main: `${profile?.display_name || "Your friend"} wants to see your cosmic compatibility`, sub: "Tap the link to accept", text: `I'd love to see our cosmic compatibility on Pause 🌙 Accept my invite here:`, url: extra.url, title: "Invite a friend" };
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
  x.strokeStyle = "#DCE6EE"; x.lineWidth = 2;
  for (let y = 380; y < H - 230; y += LH) { x.beginPath(); x.moveTo(50, y + 14); x.lineTo(W - 50, y + 14); x.stroke(); }
  x.strokeStyle = "#E9A8A0"; x.lineWidth = 3; x.beginPath(); x.moveTo(120, 300); x.lineTo(120, H - 230); x.stroke();
  x.font = "700 40px Kalam, cursive";
  const tw = x.measureText(c.label).width + 60;
  x.save(); x.translate(150, 120); x.rotate(-0.025); x.fillStyle = "rgba(232,196,112,.6)"; x.fillRect(0, 0, tw, 66); x.restore();
  x.fillStyle = "#8B3A17"; x.fillText(c.label, 180, 168);
  x.fillStyle = "#8B3A17"; x.font = "800 48px Nunito, sans-serif";
  x.fillText(parseISO(viewISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }), 150, 280);
  const size = c.main.length > 150 ? 44 : c.main.length > 90 ? 50 : c.main.length > 50 ? 58 : 68;
  x.fillStyle = "#3A3330"; x.font = `800 ${size}px Nunito, sans-serif`;
  const y = wrap(x, c.main, 150, 380, W - 260, LH);
  if (c.sub) { x.fillStyle = "#2E3A59"; x.font = "44px Kalam, cursive"; wrap(x, c.sub, 150, y + LH * 1.5, W - 260, LH); }
  x.fillStyle = "#8B3A17"; x.font = "76px 'Shadows Into Light', cursive"; x.fillText(CONFIG.APP_NAME, 150, H - 130);
  x.fillStyle = "#857A70"; x.font = "30px Nunito, sans-serif"; x.fillText("a daily diary for your mind · " + SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, ""), 150, H - 82);
  return new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function wrap(x, text, left, top, maxW, lh) {
  const words = text.split(/\s+/); let line = "", y = top;
  for (const w of words) { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { x.fillText(line, left, y); line = w; y += lh; } else line = t; }
  if (line) x.fillText(line, left, y);
  return y;
}
async function openShare(kind, extra) {
  const c = shareContent(kind, extra);
  const text = c.text, url = c.url || SITE_URL, full = `${text}\n${url}`;
  $("#shareTitle").textContent = c.title || "Share";
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
      try { if (file && kind !== "invite" && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: full }); else await navigator.share({ title: CONFIG.APP_NAME, text, url }); } catch { /* cancelled */ }
    } }));
  }
  [["WhatsApp", `https://wa.me/?text=${enc(full)}`], ["X / Twitter", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`], ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ["Telegram", `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`], ["Email", `mailto:?subject=${enc(CONFIG.APP_NAME + " · " + c.label)}&body=${enc(full)}`]]
    .forEach(([name, href]) => grid.append(el("a", { href, target: "_blank", rel: "noopener", textContent: name })));
  grid.append(el("button", { type: "button", textContent: kind === "invite" ? "Copy invite link" : "Copy text", onclick: async () => { try { await navigator.clipboard.writeText(kind === "invite" ? url : full); toast("Copied"); } catch { toast("Couldn't copy"); } } }));
  if (blob && kind !== "invite") grid.append(el("a", { href: URL.createObjectURL(blob), download: "pause.png", textContent: "Save image" }));
  if (kind === "invite") grid.append(el("p", { className: "fine wide-note", textContent: "This link works once. When your friend accepts and adds their birth details, they'll appear in your Friends list." }));
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
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200); }

// ── Start ────────────────────────────────────────────────────
renderPage();
showOldDrafts();
api.init()
  .then(async () => { await onAuthChanged(); if (store.get(K.invite) && !user) showInvite(); })
  .catch(() => toast("Couldn't connect to the journal service. You can keep writing: your draft is kept on this device."));

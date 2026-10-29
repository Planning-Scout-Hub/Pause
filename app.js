import { CONFIG } from "./config.js";
import { DAYS } from "./content.js";

const $ = (s) => document.querySelector(s);

// ── Safe localStorage helpers ────────────────────────────────
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
const K = { draft: "pause_draft", pending: "pause_pending", demoUser: "pause_demo_user", demoEntries: "pause_demo_entries" };

// ── Today ────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const now = new Date();
const TODAY = isoDate(now);
const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
const day = DAYS[dayNumber % DAYS.length];

// ── Backend: Supabase if configured, otherwise browser-only preview ──
const DEMO = !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;
let sb = null;
let user = null;

const api = {
  async init() {
    if (DEMO) { user = store.get(K.demoUser); return; }
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    user = data.session?.user ?? null;
    sb.auth.onAuthStateChange((_event, session) => {
      user = session?.user ?? null;
      setTimeout(onAuthChanged, 0); // don't call Supabase inside this callback directly
    });
  },
  async signUp(email, password) {
    if (DEMO) { user = { id: "demo", email }; store.set(K.demoUser, user); return { needsConfirm: false }; }
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
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
    user = null;
  },
  async list() {
    if (DEMO) return (store.get(K.demoEntries) || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const { data, error } = await sb.from("entries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async add(entry) {
    if (DEMO) {
      const all = store.get(K.demoEntries) || [];
      const row = { ...entry, id: String(Date.now()), created_at: new Date().toISOString() };
      all.push(row); store.set(K.demoEntries, all); return row;
    }
    const { data, error } = await sb.from("entries").insert(entry).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    if (DEMO) { store.set(K.demoEntries, (store.get(K.demoEntries) || []).filter((e) => e.id !== id)); return; }
    const { error } = await sb.from("entries").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Render today's diary page ────────────────────────────────
function renderPage() {
  document.title = `${CONFIG.APP_NAME} — a daily diary for your mind`;
  $("#appName").textContent = CONFIG.APP_NAME;
  const dateText = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#title").textContent = `Dear Diary – ${dateText}`;
  $("#theme").textContent = day.theme;

  $("#thoughtText").textContent = day.thought.text;
  $("#thoughtMore").textContent = day.thought.more;
  $("#thoughtAsk").textContent = day.thought.ask;

  $("#jokeSetup").textContent = day.joke.setup;
  $("#jokePunch").textContent = day.joke.punch;
  $("#jokeBonus").textContent = day.joke.bonus;

  $("#factText").textContent = day.fact.text;
  $("#factMore").textContent = day.fact.more;

  $("#promptText").textContent = day.prompt.text;
  $("#promptWhy").textContent = day.prompt.why;
  const box = $("#starters");
  box.innerHTML = "";
  day.prompt.starters.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "starter"; b.textContent = s;
    b.onclick = () => insertStarter(s);
    box.appendChild(b);
  });
  ta.placeholder = `Start anywhere… or try: "${day.prompt.starters[0]}"`;

  if (DEMO) $("#demoBanner").hidden = false;
}

// ── Writing area ─────────────────────────────────────────────
const ta = $("#entry");
function autosize() { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
function saveDraft() { store.set(K.draft, { date: TODAY, body: ta.value }); }
function restoreDraft() {
  const d = store.get(K.draft);
  if (d && d.date === TODAY) ta.value = d.body;
  autosize();
}
function insertStarter(text) {
  const sep = ta.value && !ta.value.endsWith("\n") ? "\n\n" : "";
  ta.value += sep + text + " ";
  autosize(); saveDraft();
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}
ta.addEventListener("input", () => { autosize(); saveDraft(); });
ta.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(); });

const currentEntry = () => ({ entry_date: TODAY, theme: day.theme, prompt: day.prompt.text, body: ta.value.trim() });

let saving = false;
async function persist(entry) {
  if (saving) return;
  saving = true;
  $("#saveBtn").disabled = true;
  try {
    await api.add(entry);
    store.del(K.pending);
    store.del(K.draft);
    if (entry.entry_date === TODAY) { ta.value = ""; autosize(); }
    toast("Saved to your journal ✎");
  } catch (err) {
    toast("Couldn't save: " + (err.message || "please try again"));
  } finally {
    saving = false;
    $("#saveBtn").disabled = false;
  }
}

async function save() {
  const entry = currentEntry();
  if (!entry.body) {
    ta.classList.add("shake"); ta.focus();
    setTimeout(() => ta.classList.remove("shake"), 400);
    return;
  }
  if (user) return persist(entry);
  store.set(K.pending, entry); // kept safe while they sign up
  openAuth("signup", true);
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
function openAuth(mode, fromSave = false) {
  $("#authTitle").textContent = fromSave ? "Keep this entry" : (mode === "signup" ? "Start your journal" : "Welcome back");
  $("#authMsg").textContent = fromSave
    ? "Your words are safe. Create a free account and every entry is kept in your own private journal, organised by date."
    : "Your journal is private to you, organised by month and searchable.";
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
        $("#authMsg").textContent = `We've sent a confirmation link to ${email}. Click it and you'll come back to this page, and your entry will be saved automatically.`;
        $("#authForm").hidden = true;
        $("#switchRow").hidden = true;
        return;
      }
    } else {
      await api.signIn(email, password);
    }
    close("#authModal");
    if (DEMO) onAuthChanged(); // Supabase triggers this itself
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
    const pending = store.get(K.pending);
    if (pending) await persist(pending);
  }
}

$("#authBtn").onclick = async () => {
  if (user) { await api.signOut(); onAuthChanged(); toast("Signed out"); }
  else openAuth("login");
};

// ── My journal ───────────────────────────────────────────────
let entriesCache = [];
$("#journalBtn").onclick = async () => {
  if (!user) return openAuth("signup");
  open("#journalModal");
  $("#search").value = "";
  $("#entries").innerHTML = `<p class="empty">Opening your journal…</p>`;
  try {
    entriesCache = await api.list();
    renderEntries();
  } catch (ex) {
    $("#entries").innerHTML = "";
    $("#entries").append(Object.assign(document.createElement("p"), { className: "empty", textContent: "Couldn't load entries: " + ex.message }));
  }
};
$("#search").addEventListener("input", renderEntries);

function renderEntries() {
  const q = $("#search").value.trim().toLowerCase();
  const list = entriesCache.filter((e) =>
    !q || [e.body, e.prompt, e.theme].some((t) => (t || "").toLowerCase().includes(q)));
  const box = $("#entries");
  box.innerHTML = "";
  $("#journalMeta").textContent = `${entriesCache.length} entr${entriesCache.length === 1 ? "y" : "ies"} · ${user.email}`;

  if (!list.length) {
    box.innerHTML = `<p class="empty">${entriesCache.length ? "No entries match that search." : "Your first page is waiting. Today's journal idea is a good place to start."}</p>`;
    return;
  }
  let lastMonth = "";
  list.forEach((e) => {
    const d = parseISO(e.entry_date);
    const month = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    if (month !== lastMonth) {
      box.append(Object.assign(document.createElement("h3"), { className: "month", textContent: month }));
      lastMonth = month;
    }
    const card = document.createElement("article");
    card.className = "entry";

    const head = document.createElement("div");
    head.className = "entry-head";
    const left = document.createElement("div");
    const date = Object.assign(document.createElement("span"), { className: "entry-date", textContent: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) });
    left.append(date);
    if (e.theme) left.append(Object.assign(document.createElement("span"), { className: "entry-theme", textContent: e.theme }));

    const del = Object.assign(document.createElement("button"), { className: "del", type: "button", textContent: "Delete" });
    del.onclick = async (ev) => {
      ev.stopPropagation();
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Tap again to delete"; return; }
      try { await api.remove(e.id); entriesCache = entriesCache.filter((x) => x.id !== e.id); renderEntries(); }
      catch (ex) { toast("Couldn't delete: " + ex.message); }
    };
    head.append(left, del);

    const prompt = Object.assign(document.createElement("p"), { className: "entry-prompt", textContent: e.prompt || "" });
    const body = Object.assign(document.createElement("p"), { className: "entry-body", textContent: e.body, title: "Tap to read the whole entry" });
    body.onclick = () => card.classList.toggle("expanded");

    card.append(head, prompt, body);
    box.append(card);
  });
}

$("#signOutBtn").onclick = async () => { await api.signOut(); close("#journalModal"); onAuthChanged(); toast("Signed out"); };

// ── Modal + toast helpers ────────────────────────────────────
function open(sel) { $(sel).hidden = false; }
function close(sel) { $(sel).hidden = true; }
document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => { if (e.target === m || e.target.hasAttribute("data-close")) m.hidden = true; });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal:not([hidden])").forEach((m) => (m.hidden = true));
});
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

// ── Start ────────────────────────────────────────────────────
renderPage();
restoreDraft();
api.init()
  .then(onAuthChanged)
  .catch(() => toast("Couldn't connect to the journal service. You can keep writing; try saving again in a moment."));

// ─────────────────────────────────────────────────────────────
//  SETTINGS
//  Leave the two Supabase values empty to run in "preview mode"
//  (entries are kept only in the visitor's browser).
//  Paste your values from Supabase → Project Settings → API to
//  turn on real accounts. The anon key is SAFE to publish: your
//  data is protected by the Row Level Security rules in
//  supabase-setup.sql, not by hiding this key.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  APP_NAME: "Pause",
  SUPABASE_URL: "",       // e.g. "https://abcdefghijk.supabase.co"
  SUPABASE_ANON_KEY: "",  // the long "anon public" key
};

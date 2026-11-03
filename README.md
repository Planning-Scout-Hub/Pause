# Pause — a daily diary for your mind

**Live site:** https://pause-diary.pages.dev/ (hosted on Cloudflare Pages; the old GitHub Pages address forwards here)

A one-page, installable web app that looks like an open diary. Every day has a **theme chosen by what's happening in the sky** (the Moon's sign, a New or Full Moon, a planet changing sign or turning retrograde, an eclipse). The theme ties together:

- **Food for Thought**: a true, mind-bending fact about the universe or being human, with a question to sit with.
- **Today in the Sky**: the day's main astrological event, calculated live from real astronomical positions, plus a personal reading for signed-in users who add their birth date, time and place.
- **Random Fact of the Day**: history, science or anthropology worth telling people about.
- **Journal Entry Idea**: a creative, therapeutic prompt with tap-to-insert sentence starters.

Signed-in users also get **My chart** (Sun, Moon, Rising, every planet and house), **Friends** (compatibility and "today between you" for people they add) and **My journal** (every entry by date, searchable). Everything has share buttons, including a diary-style image for Instagram and TikTok stories.

## Files

| File | What it does |
|---|---|
| `index.html`, `styles.css` | Layout and diary look |
| `app.js` | The app: saving, accounts, chart, friends, sharing, install |
| `astro.js` | Astronomy + astrology engine (positions, events, charts, compatibility) |
| `content.js` | Food for thought and journal ideas by theme, plus daily facts. **Add content here.** |
| `config.js` | App name + Supabase connection |
| `supabase-setup.sql` | Database tables and privacy rules (already run) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Makes it installable on phones and computers, and lets it open offline |
| `og-image.png` | Preview image shown when the link is shared |

## How data is kept safe

- Saved entries, drafts, birth details and friends are stored in your Supabase database. Row Level Security means each account can only ever read its own rows.
- While someone is writing, the draft is saved on the device on every keystroke and, when signed in, to their account about a second later. Shutting the laptop or closing the tab loses nothing; unsaved drafts from earlier days are offered back with a one-tap "Save it to my journal".

## Adding daily content

Open `content.js`. `THOUGHTS` and `PROMPTS` are grouped by theme; `FACTS` is one list that rotates daily. The Moon stays in each sign for 2–3 days, so each theme needs at least 3 thoughts and 2–3 prompts to avoid repeats; more is better. On GitHub you can edit straight in the browser (open the file → ✏️ → edit → **Commit changes**).

Which sky event maps to which theme is set in `astro.js` (`SIGN_THEME` and `themeFor`).

A few rules that keep the quality up:

- **Food for thought**: one surprising true thing about the universe, life or being human, then a short paragraph on what we know and don't know, then one personal question.
- **Fact**: something people will want to repeat at dinner. Check it against a reliable source (museum, university, NASA, a published study) before adding it.
- **Prompt**: simple enough for someone who never writes, with a creative twist and three sentence starters.

## Good to know about the free plans

- **Supabase Free**: 50,000 monthly active users and 500 MB of database, which is a lot of journal text. A free project is **paused after about a week with very little activity**; a few visits a day keeps it awake. If it ever pauses, you'll get an email and can restore it from the Supabase dashboard.
- **GitHub Pages**: free for public repositories.
- **Custom domain (optional)**: buy one from any registrar (Cloudflare, Porkbun, Namecheap), then in GitHub **Settings → Pages → Custom domain**, and follow GitHub's DNS instructions.

## Ideas for later

- **Morning email/notification** with just the food for thought (free tiers: Supabase Edge Functions + Resend, or a simple Buttondown newsletter).
- **"On this day"**: show what the user wrote exactly one month or one year ago.
- **Theme archive**: let people browse past days by theme.
- **Letter to future you**: an entry that stays locked until a date they choose.
- **Install to phone home screen** (a PWA manifest) so it feels like an app.
- **Export my journal** as a text/PDF file.
- **Translations** (Spanish, Romanian…) by duplicating `content.js`.

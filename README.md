# Pause — a daily diary for your mind

A one-page web app that looks like an open diary. Every day has a **theme** (Time, Fear, Kindness, Rest…) that ties together four sections:

- **Food for Thought**: a reminder of how strange and wonderful this human experience is, and what we have and haven't figured out yet.
- **Joke of the Day**: the punchline is hidden until you tap.
- **Random Fact of the Day**: history, science or anthropology worth telling people about.
- **Journal Entry Idea**: a creative prompt with a therapeutic benefit, plus tap-to-insert sentence starters for people who "never write".

Each section opens to show more. Visitors write on the lined right-hand page and press **Save**. Saving asks them to sign up, and their entries are then kept in their own private journal, organised by month and searchable.

**Total cost: €0.** It runs on GitHub Pages (free hosting) and Supabase (free accounts + database). A custom domain is optional, roughly €10–15/year.

---

## What's in this folder

| File | What it does | Do you edit it? |
|---|---|---|
| `index.html` | The page layout | Rarely |
| `styles.css` | Colours, fonts, spacing | If you want a different look |
| `content.js` | All the daily pages (theme + the four sections) | **Yes, this is where you add content** |
| `config.js` | App name + your Supabase keys | **Yes, once** (Step 4) |
| `app.js` | The logic (daily rotation, saving, sign-up, journal) | No |
| `supabase-setup.sql` | Creates the secure journal table | Paste once into Supabase (Step 3) |

---

## Step 1 — Put the files on GitHub (5 min)

1. Go to **github.com** → click **+** (top right) → **New repository**.
2. Name it, for example `pause`. Set it to **Public** (free GitHub Pages needs a public repo; the journal entries are *not* in the repo, they live in Supabase, so nothing private is exposed).
3. Tick **Add a README file** → **Create repository**.
4. In the new repo click **Add file → Upload files**.
5. Unzip the folder I gave you and drag **all the files** into the upload box (not the folder itself, the files inside it).
6. Click **Commit changes**.

## Step 2 — Turn on free hosting with GitHub Pages (2 min)

1. In your repo go to **Settings → Pages**.
2. Under **Build and deployment → Source** choose **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Wait 1–2 minutes and refresh. You'll see: *"Your site is live at `https://YOUR-USERNAME.github.io/pause/`"*.

At this point the site works in **preview mode**: everything works, but entries are only stored in the visitor's own browser. Steps 3–5 turn on real accounts.

## Step 3 — Create the free account system with Supabase (10 min)

1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project** → give it a name, set a strong database password (save it somewhere), pick the region closest to your users (e.g. *West EU*), plan **Free** → **Create**.
3. When it's ready, open **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase-setup.sql`, copy everything, paste it in, click **Run**. You should see "Success".
   This creates the `entries` table and the security rules that make sure every person can only see their own journal.

## Step 4 — Connect your site to Supabase (3 min)

1. In Supabase go to **Project Settings → API** (sometimes labelled *Data API* / *API Keys*).
2. Copy the **Project URL** and the **anon public** key.
3. In GitHub open `config.js` → click the ✏️ pencil → paste them in:

```js
SUPABASE_URL: "https://abcdefghijk.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

4. **Commit changes.** GitHub Pages republishes in about a minute.

> The anon key is designed to be public. Security comes from the Row Level Security rules in Step 3. **Never** paste the `service_role` key anywhere in this project.

## Step 5 — Tell Supabase where your site lives (2 min)

So that the "confirm your email" link sends people back to your page:

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: `https://YOUR-USERNAME.github.io/pause/`
3. **Redirect URLs** → add the same address.
4. Save.

By default Supabase asks new users to confirm their email. The app handles this: the entry is kept safe while they confirm, and saved automatically when they come back through the link. If you'd rather skip confirmation while testing: **Authentication → Providers → Email → turn off "Confirm email"**.

## Step 6 — Test it

1. Open your site, write something on the lined page, press **Save**.
2. Create an account → confirm the email → you land back on the page and see "Saved to your journal ✎".
3. Click **My journal**: your entry is there, grouped by month.
4. In Supabase → **Table Editor → entries** you'll see the row.

---

## Adding daily content

Open `content.js`. It holds a list called `DAYS`; each day is one block with a `theme`, a `thought`, a `joke`, a `fact` and a `prompt`. The site shows one day per calendar day and loops back to the start when it reaches the end, so 15 days means every page repeats every 15 days. Aim for 60–90 days before launch so regular visitors rarely see a repeat.

To add a day: copy a whole block from `{` to `},`, paste it at the end of the list, and change the text. On GitHub you can do this straight in the browser (open the file → ✏️ → edit → **Commit changes**).

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

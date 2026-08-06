# bdanmaku-web

Web viewer for translated Bilibili danmaku (bullet comments) overlaid on YouTube videos. Built with SvelteKit.

Pairs with [bdanmaku](https://github.com/UlyssesZh/bdanmaku) — an mpv plugin that downloads, converts, and translates bilibili danmaku into ASS subtitle files.

## Architecture

```
bdanmaku (mpv plugin)          bdanmaku-web (this repo)
  │                                │
  ├─ downloads XML danmaku         │
  ├─ biliass → ASS                 │
  ├─ danmaku_translate.py          │
  │  --mode inline → ASS           │
  ├─ Ctrl+E → exports .ass ────────┤
  │                                ├─ Admin: import .ass via file upload
  │                                ├─ Admin: edit translations, add notes
  │                                ├─ Public: YouTube embed + overlay
  │                                └─ Database: Turso (prod) / SQLite (dev)
```

## Setup

### Prerequisites

- Node.js ≥ 20
- npm
- A [Turso](https://turso.tech) account (free tier: 9 GB)

### 1. Clone

```bash
git clone <repo-url>
cd bdanmaku-web
npm install
```

### 2. Environment

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

| Variable | How to get it |
|---|---|
| `TURSO_DATABASE_URL` | `turso db show <name> --url` |
| `SESSION_SECRET` | `openssl rand -hex 32` |

### 3. Database

Push the Drizzle schema to Turso:

```bash
npx drizzle-kit push --config drizzle.turso.config.ts
```

Seed the admin user:

```bash
node -e "
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});
(async () => {
  await client.execute({
    sql: 'INSERT OR IGNORE INTO users (username, password_hash, created_at) VALUES (?, ?, ?)',
    args: ['admin', bcrypt.hashSync('admin', 10), new Date().toISOString()]
  });
  client.close();
})();
"
```

### 4. Run (local dev)

```bash
npm run dev
```

Dev mode connects to the same Turso database (configured via `.env`).

## Deploy (Vercel)

1. Push to GitHub
2. Import the repo in Vercel
3. Add all variables from `.env` in **Settings → Environment Variables**:

   ```
   TURSO_DATABASE_URL
   TURSO_AUTH_TOKEN
   SESSION_SECRET
   ```

4. Deploy — Vercel auto-detects SvelteKit

To sync production env to local for testing:

```bash
vercel env pull .env.local
```

## Admin Workflow

1. Watch a bilibili video in mpv with bdanmaku installed
2. Press `Ctrl+E` — exports translated ASS to `~/danmaku_exports/`
3. Open the admin panel:
   - Go to `/admin` → login → Dashboard
   - Create a VOD (title, YouTube URL) at `/admin/vod/new`
   - Add a bilibili upload (BV ID, timing offset, source attribution)
   - Click **Import ASS** → select the exported `.ass` file
4. Edit translations and add notes in the split-panel editor:
   - YouTube embed on the left with live danmaku overlay
   - Interactive table on the right (click row → seek video)
   - Bottom panel: edit translation text and markdown notes
5. Visit `/watch/[vodId]` to see the public view

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── DanmakuOverlay.svelte     # Timed overlay (rAF loop)
│   │   └── DanmakuLine.svelte        # Single danmaku line
│   ├── danmaku/
│   │   ├── ass-parser.ts             # Parse inline-mode ASS → typed lines
│   │   └── renderer.ts               # rAF loop, scroll interpolation
│   └── server/
│       └── db/
│           ├── schema.ts             # Drizzle schema (vods, uploads, danmaku_lines, users)
│           └── index.ts              # DB connection (SQLite dev / Turso prod)
├── routes/
│   ├── +page.svelte                  # VOD library
│   ├── watch/[vodId]/                # Public player + overlay
│   ├── admin/                        # Auth-gated admin panel
│   │   ├── login/                    # Login page
│   │   ├── logout/                   # Clear session
│   │   ├── vod/[vodId]/              # Manage uploads per VOD
│   │   └── upload/[uploadId]/        # Split-panel translation editor
│   └── api/
│       ├── upload/[id]/import/       # POST: import ASS file → parse → upsert
│       └── danmaku/[id]/             # PATCH/DELETE: edit translation or note
├── hooks.server.ts                   # Auth check on /admin/* routes
└── app.css                           # Tailwind
```

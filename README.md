# CTU Moalboal · AACCUP Accreditation

**Live site: [aaccup.ctu-moalboal.online](https://aaccup.ctu-moalboal.online)**

The online evidence dossier of Cebu Technological University — Moalboal Campus for the 2026 AACCUP
**Level III visit**. Each program has its own volume:

- **BSIE** — Bachelor of Science in Industrial Engineering · [aaccup.ctu-moalboal.online/bsie](https://aaccup.ctu-moalboal.online/bsie)
- **BSFi** — Bachelor of Science in Fisheries · [aaccup.ctu-moalboal.online/bsfi](https://aaccup.ctu-moalboal.online/bsfi)

The evidence files stay in Google Drive. This site organizes them by area so they can be read
and checked in one place. The task force edits it through the **AACCUP Desk** at
[/admin](https://aaccup.ctu-moalboal.online/admin).

This README has three parts:

1. [For accreditors and visitors](#1-for-accreditors-and-visitors) — how to find and read the evidence. No sign-in needed.
2. [For the task force](#2-for-the-task-force-admins-focal-persons-area-chairs) — how admins, focal persons, and area chairs manage the content.
3. [For developers](#3-for-developers) — how the system is built and deployed.

---

## 1. For accreditors and visitors

You do not need an account. Open **[aaccup.ctu-moalboal.online](https://aaccup.ctu-moalboal.online)**
and choose a program.

### Finding the evidence

Each program page opens with the program's introduction. **Open the documents** (or **All
documents** in the sidebar) lists every section. The sidebar groups them the same way as the visit:

| Group | What it holds |
|---|---|
| **Common documents** | Program-wide records: certification, BOR resolution, Certificate of Program Compliance (COPC), checklist, and annexes. |
| **Current visit · 2026** | The areas under review in this visit (e.g. Faculty Development, Instruction, Extension, Linkages). |
| **Previous visit** | The ten areas of the last survey, with that survey's **recommendations** and the campus's **compliance** with each one. This is the record of improvement, not current evidence. |

The number beside each section counts its linked files. A dash means nothing is linked yet.

### Reading a document

- Click a document to **preview it on the page**. On a phone it opens full screen. Use the arrow
  keys (or the arrows in the panel) to move to the next file in the same section.
- **Open in Drive** opens the original file in a new tab.
- An **evidence code** (e.g. `A3-P1-S2`) beside a title matches the file to the indicator in the
  survey instrument.
- **In preparation** means the task force has listed the document but has not linked the final
  file yet. It is a placeholder on purpose, not a broken link.

### Other tools

- **Search documents** (sidebar, or **Search** in the header) searches every record in that
  program by title, area, or keyword.
- **Visit selector** (the year in the header) switches to an earlier visit's dossier.
- **Print evidence index** (in the `…` menu at the bottom right of a program page) prints the full
  list of documents with a QR code for each, for a printed binder or the evaluation room.
- **Recommendations** on a previous-visit area show each recommendation, the action taken, and
  its status: *Complied*, *Partly complied*, or *Not yet complied*.
- The **sun/moon button** in the header switches light and dark mode.

If a file does not open, ask the task force. Every file is meant to be viewable by anyone with the link.

---

## 2. For the task force: admins, focal persons, area chairs

### Signing in

Go to **[aaccup.ctu-moalboal.online/admin](https://aaccup.ctu-moalboal.online/admin)** and sign
in with your **CTU Accounts** login, the same account as the other campus systems. Access is by
invitation: an admin must add your CTU email first (see [People](#people-admins-only)).

Staff also see a **Manage** button in the public site's header, and an **Edit page / Manage**
shortcut in the `…` menu on their program's pages.

### Roles

| Role | Can do |
|---|---|
| **Admin** | Everything: people and roles, every program, the home page. |
| **Focal person** | Edits and **publishes** content for every program and the home page. |
| **Area chair** | Edits one assigned program: adds documents and **submits** them for review. Cannot publish. |
| **Reviewer** | Reads drafts and approves or returns them. |

### How changes go live

Every piece of content has a **draft** and a **published** version. The public site only shows
what is published.

1. **Save** keeps your changes as a draft. Nothing changes on the public site yet.
2. **Submit** (area chairs) sends it for review.
3. **Publish** (focal persons and admins) puts it on the public site. Pages refresh within about a minute.

If an area chair edits something already published, it turns back into a draft until it is
published again. Each section keeps a **History** of submits and publishes.

### The Desk, page by page

**Overview** (`/admin`) shows each program's progress, what is waiting for review, and
**Links to fix**: documents whose link is broken, private, or not on Drive. Fix the sharing (see
[Google Drive rules](#google-drive-rules)) and sync the section again.

**Programs** (`/admin/programs`) holds one record per program:

- **Program settings**: code, name, web address (slug), summary, tagline, theme colors (with a
  contrast check), logo, cover photo, website, email, and phone. **Save program**.
- **Visits**: a program can have several visits (e.g. the 2024 survey and the 2026 visit). One is
  active. The public label must say **"Level III visit"**, never "accredited".
- **Sections** inside a visit: common documents, the current-visit areas, and the
  previous-visit areas 1–10. **Copy as drafts** copies another program's or visit's common
  documents as a starting point.
- **Edit program page**: the program's public front page (see [Editing a front page](#editing-a-front-page)).

**A section page** is where most of the work happens:

- **Add document**: title, Drive link, type, format, date, note, and the optional **evidence code**.
- **Paste links** adds many at once, one per line: `Title | https://drive.google.com/…`. A tab or a
  space works too, so you can paste two columns from a spreadsheet. The format (PDF, Doc, Sheet,
  folder…) is guessed from the link.
- **Area chair**: the name shown on the public page for that area.
- **Recommendations** (previous-visit areas): each recommendation from the last survey, the
  action taken, and its status (*Complied*, *Partly complied*, *Not yet complied*).
- **Drive folder**: the section's folder, matched automatically or set by hand.
- **Submit section** / **Publish section** / **Publish all** act on every document in the section.

**Google Drive sync** (on a visit's page):

1. Put the whole visit in **one root folder** and share it with the sync service account as Viewer.
2. Each section gets its own folder, **matched automatically** by name or set by hand.
   - A folder with "Common" in its name holds the common documents.
   - "Area 1" … "Area 10" go to the previous-visit areas. Roman numerals work too ("Area IV").
   - Other folders match a section whose title they contain, e.g. "02 INSTRUCTION".
   - Folders may be grouped one level down: a group named "Previous", "Findings", or "Compliance"
     holds the previous-visit areas; one named "Level III" or "Current" holds the current sections.
   - The visit page has a **Naming guide** with a **Copy names** button for the full folder tree.
3. Sync brings the files in as documents. It also runs automatically every night.

### Editing a front page

The home page (**Home page** in the sidebar) and each program's front page (**Programs → a
program → Edit program page**) are built from **blocks**: text, photo gallery or carousel, highlights (stats),
history timeline, vision and mission, people, organization chart, events, news, FAQ, partners,
testimonials, video, photo with text, and a call to action.

- **Add block** picks a kind. The arrows reorder blocks; the bin removes one.
- **Preview** shows the page beside the editor with your drafts. Click a block in the preview to
  jump to its editor. Use the desktop or phone toggle to check both.
- Text boxes accept a little formatting through the toolbar: **bold**, *italic*, links, and
  bulleted or numbered lists. There are deliberately no font, color, or size options, so every
  page stays consistent.
- **Vision and mission** statements have a **Font** option (Reading or Heading) and a **Text size**
  option. The reading font suits a long mission; the heading font suits a short vision.
- On the home page, **Page header & site texts** holds the big heading, the intro line, the
  **hero photo** behind the heading (a wide campus photo, e.g. the main building), the browser
  title, the search description, and the footer contact line. **Publish** puts them live.

Photos are uploaded in the editor (up to 5 MB each). Use real photos you have the right to use,
with a short description for people who cannot see them.

### People (admins only)

**People** (`/admin/people`) controls who can open the Desk. Add a person's **CTU email** and
role. An area chair must also be given their **program**. Removing a person takes their access
away immediately.

### Google Drive rules

- Share every file and folder as **Anyone with the link — Viewer**. Then test the link in a
  signed-out (private) browser window. A link that opens for the task force but not for an
  evaluator is the most common failure of a digital dossier.
- Keep the final file in the folder for its area, so the nightly sync and **Links to fix** stay accurate.

### Wording rules

- Say **"Level III visit"**, not "Level III accredited". The 2026 visit is the application for Level III.
- The previous-visit areas are the archive of the last survey's recommendations and compliance.
  Keep current evidence in the current-visit areas.
- Leave a missing document as **In preparation** rather than linking a draft or a wrong file.

---

## 3. For developers

**Stack:** SvelteKit 3, Svelte 5, Tailwind CSS 4, shadcn-svelte, Supabase (Postgres, RLS,
storage), Vercel. Fonts: Bricolage Grotesque (headings), Inter (body), IBM Plex Mono (labels).

### Run locally

Requirements: Node.js 22 and pnpm. The Vercel adapter's build step needs Node 18–22; `pnpm dev` and `pnpm check` also run on newer Node.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Fill `.env` from the comments in [`.env.example`](.env.example):

| Variable | Used for |
|---|---|
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` | Public reads (through RLS and the `published_*` RPCs). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only: staff lookup, people management. |
| `ACCOUNTS_URL` | CTU Accounts SSO (`https://accounts.ctu-moalboal.online`). |
| `AACCUP_DEV_SSO_EMAIL` | Dev only: the SSO cookie never reaches `localhost`, so `pnpm dev` signs you in as this email. |
| `PUBLIC_SITE_URL` | Canonical URLs and auth redirects. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Drive sync (server only). |
| `CRON_SECRET` | Bearer token for the nightly `/api/cron/drive-sync`. |
| `SUPABASE_DB_PASSWORD` | CLI and `psql` only, never the app. |

If the Supabase variables are missing, the public site falls back to the static data in
`src/lib/data/` (see [CONTENT.md](CONTENT.md)).

> The `.env` file has Windows (CRLF) line endings. To use it from a shell, strip them first:
> `set -a; . <(tr -d '\r' < .env); set +a`

Checks:

```bash
pnpm check     # svelte-check, must report 0 errors
pnpm build
```

### How it works

- **Public pages** are server-rendered from published rows (`published_dossier`,
  `published_programs`, `published_content`, landing blocks) and cached at the edge for 60 seconds
  (`s-maxage=60, stale-while-revalidate=300`).
- **The admin** (`/admin`) is dynamic. The server verifies the `ctu.session_token` cookie with CTU
  Accounts, matches an invited profile by exact email, and signs a short-lived Supabase JWT, so
  every admin query runs under RLS with the staff member's role.
- **Content workflow**: rows carry `draft_value`/`published_value` (or a status) and move draft →
  in review → published through RPCs that write a revision and a publish log.
- **Landing blocks** are JSON per block kind, cleaned on save by `src/lib/server/landing-content.ts`.
  Body text uses a small markup (`**bold**`, `*italic*`, `[link](https://…)`, `-`/`1.` lists)
  parsed by `src/lib/rich-text.ts` and rendered as elements, never as HTML.
- **Drive sync** reads each visit's root folder with a service account. It runs from the admin
  and nightly through the Vercel cron in `vercel.json`.
- **Uploads** go to the public `public-images` storage bucket under `programs/<program-id>/`
  (`programs/site/` for the home page).

### Project shape

```text
src/
  routes/
    +page.svelte                 home: hero, program cards, home blocks
    [program]/                   program front page, dossier, sections, search, print, visits
    admin/                       the AACCUP Desk (overview, programs, visits, sections, home, people)
    api/cron/drive-sync/         nightly Drive sync
  lib/
    components/program/          program pages, landing blocks, document preview
    components/site/             header, footer, document rows, photo, rich text
    components/admin/            Desk editors
    components/ui/               shadcn-svelte primitives (square corners)
    server/                      Supabase access, auth, block cleaners, Drive
    data/                        types and the static fallback
    motion.ts                    reveal, photo loading, section snapping
supabase/
  migrations/                    schema, RLS, RPCs, seed (see supabase/README.md)
scripts/                         seed generation, static preview
```

### Database migrations

Migrations live in [`supabase/migrations/`](supabase/migrations/). Production was migrated by hand
(SQL editor or `psql`), so `supabase_migrations.schema_migrations` only records the early ones.
Before applying a new migration:

1. Back up whatever it replaces (functions, rows).
2. Apply it in a single transaction: `psql "host=db.<ref>.supabase.co port=5432 user=postgres dbname=postgres sslmode=require" -1 -f <file>`.
3. Check the result with a read query.

See [`supabase/README.md`](supabase/README.md) for roles, RLS, and smoke tests.

### Deploy

Vercel builds every push. **Merging into `main` deploys production** to
`aaccup.ctu-moalboal.online`. Work happens on a branch, then a pull request is merged into `main`.
Environment variables are set in Vercel → Settings → Environment Variables. The service-role key
and the Google key stay server-only.

### Design

Formal and quiet: square corners, a deep petrol ink with a program color each (maroon for BSIE,
green for BSFi), and a faint graph-paper texture. Motion is subtle and plays once: text rises in,
photos sharpen in as they load, and sections snap on wide screens. Everything stops under
`prefers-reduced-motion`. The original brief is in
[`docs/superpowers/specs/`](docs/superpowers/specs/).

---

Prepared for the Campus AACCUP Task Force, Cebu Technological University — Moalboal Campus.

# CTU Moalboal AACCUP Level III dossier

A fast, static evidence portal for the **BSIE** and **BSFI** Level III accreditation visits at Cebu Technological University — Moalboal Campus.

The site is the index. The evidence stays in Google Drive. There is no database, no login, no upload, and no server to maintain.

**Stack:** SvelteKit 2, Svelte 5, shadcn-svelte, Tailwind CSS 4, Vercel.

---

## What is in the site

- `/` — cover sheet, the two program volumes, the ten-area index, recently linked evidence, and the institutional record.
- `/programs/bsie` and `/programs/bsfi` — one volume per program.
- `/programs/[program]/areas/[area]` — one AACCUP area and its document groups.
- `/documents` — searchable index of every record, with program / area / type filters and shareable URLs.
- `/resources` — certification, BOR resolution, COPC, checklist, and program-wide evidence.
- `/about` — what a Level III visit asks for, how the dossier is organised, Drive access guidance, and the campus timeline.

The content is seeded as follows:

- **BSFI** — ten areas linked to the public 2024 BSFI evidence index, plus program-wide extension, library, and linkages records.
- **BSIE** — the same ten-area structure, with all Drive links marked **pending**. Replace them with the current visit's files.
- **Institutional record** — certification and checklist are pending; the BOR resolution and COPC cards point to the existing public reference pages.

A pending row is deliberate. It says "Link pending" and does not pretend to work.

---

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Type check:

```bash
pnpm check
```

Production build:

```bash
pnpm build
```

Preview the exact prerendered output without Vite:

```bash
node scripts/serve-static.mjs .vercel/output/static 4173
```

Then open `http://127.0.0.1:4173`.

---

## The one file you edit

Almost all content lives in **`src/lib/data/accreditation.ts`**. Campus-wide copy and contact notes live in **`src/lib/data/site.ts`**.

See [CONTENT.md](CONTENT.md) for the data shape, examples, and the exact steps to replace a pending link or add a document.

The short version:

1. Find the `pending(...)` entry for the area.
2. Replace it with `linked(...)`.
3. Put the Google Drive file URL in the fourth argument.
4. Run `pnpm check` and `pnpm build`.
5. Commit and push; Vercel redeploys.

---

## Drive permissions — the part that breaks most dossiers

Every linked file **and folder** must be shared as:

> **Anyone with the link — Viewer**

Test each important link from a signed-out browser, not from your own Google account. A link that works for the task force but not for an external evaluator is the most common failure in a digital accreditation dossier.

If a file is inside a restricted folder, sharing the file alone may not be enough for a folder link. Share the folder and let the files inherit, or share each file explicitly.

---

## Deploy to Vercel

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel detects **SvelteKit**. Keep the default build command (`pnpm build`) and the default output settings; `@sveltejs/adapter-vercel` handles the rest.
4. No environment variables are required.
5. Add the production domain under **Settings → Domains** once the campus decides on one.

CLI alternative, if the Vercel CLI is already logged in:

```bash
vercel
vercel --prod
```

The site is fully prerendered. There is no database, no API route, and no server state, so the deployment is static and cheap to host.

---

## Project shape

```
src/
  app.css                         design tokens, fonts, base styles
  lib/
    components/
      site/                       header, footer, volume spines, area table, document rows
      ui/                         shadcn-svelte primitives
    data/
      accreditation.ts            programs, areas, documents, institutional records
      site.ts                     campus copy, nav, survey metadata
      types.ts                    content types
    format.ts                     date, file-format, and kind labels
    utils.ts                      shadcn class helpers
  routes/
    +layout.svelte                global shell
    +layout.ts                    prerender enabled
    +page.svelte                  home
    programs/[program]/          program volume
    programs/[program]/areas/[area]/  area page
    documents/                    search and filters
    resources/                    institutional record
    about/                        visit context
scripts/
  serve-static.mjs                local preview for the Vercel static output
```

- `export const prerender = true` is set once in `src/routes/+layout.ts`, so every route is generated at build time.
- Dynamic program and area routes expose `entries()` so SvelteKit prerenders every combination.
- Search is client-side over the static document index. The URL keeps `q`, `program`, `area`, and `kind` so a filtered view can be shared.

---

## Design notes

The visual direction is **Two Volumes, One Record**: a bound dossier with maroon for BSIE and green for BSFI, set against a deep-petrol ground and a cool salt page. Display type is Bricolage Grotesque; body and UI are Instrument Sans; document metadata is IBM Plex Mono.

The site intentionally avoids the Google Sites look: no stock hero image, no card grid, no carousel. The two program spines, the ten-row ledger, and the folder-tab institutional cards carry the identity.

The full design brief is in [`docs/superpowers/specs/2026-10-21-aaccup-site-design.md`](docs/superpowers/specs/2026-10-21-aaccup-site-design.md).

---

## Verification checklist before publishing

- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] Every `linked` document opens in a signed-out browser.
- [ ] Every area page has the right recommendations and compliance report.
- [ ] The survey year and level in `src/lib/data/site.ts` and `src/lib/data/accreditation.ts` match the official AACCUP schedule.
- [ ] The Vercel preview URL is tested on a phone.
- [ ] The production domain is connected.

---

Prepared for the Campus AACCUP Task Force, CTU Moalboal. Built by the Campus MIS Team.

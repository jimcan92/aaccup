# CTU Moalboal AACCUP 2026

A fast, static accreditation dossier for **BSIE** and **BSFI** at Cebu Technological University — Moalboal Campus.

Each program is its own volume. The current 2026 visit areas come first, the previous visit’s 10-area recommendations sit behind them, and the institutional record is shared. Evidence stays in Google Drive. Editable site content — carousel images, VMGO, wordings, program/area/document metadata — moves to Supabase with a custom admin.

**Stack:** SvelteKit 2, Svelte 5, shadcn-svelte, Tailwind CSS 4, Supabase, Vercel.

> **Phase 1 status:** the Supabase schema, RLS, and seed content are in [`supabase/`](supabase/). The admin UI and the public read layer are the next phase. Until they are wired, the public site uses the static TypeScript content as a fallback.

---

## The structure

```text
/                                   Campus landing: volumes, VMGO, carousel, records
/bsie                               BSIE volume
/bsie/visit/faculty-development     Current visit — 4 areas
/bsie/visit/instruction
/bsie/visit/extension
/bsie/visit/linkages
/bsie/areas/01-vmgo                 Previous visit — 10 areas
...
/bsie/areas/10-administration
/bsie/documents                     Search scoped to BSIE
/bsie/records                       Shared institutional record
/bsie/about                         About the visit
/bsfi/...                           Same structure
```

Two different layers, two different words:

- **Current visit** — the four areas under review in 2026. These are the top-level links in each volume.
- **Previous visit — 10 areas** — the last survey’s recommendations and compliance record. These live under `More` and inside the volume.

Do not mix the two. The previous-area pages explicitly say they are not current evidence.

## Content status

- **BSFI** — previous 10 areas are seeded from the public 2024 BSFI index. Current-visit areas are in preparation.
- **BSIE** — previous and current areas are in place, but all Drive links are in preparation.
- **Records** — certification and checklist are in preparation; BOR and COPC point to public reference pages.
- **Status wording** — the site says **Level III visit**, not “Level III accredited.” The official campus status page still lists BSFI and BSIE as Level II; the 2026 visit is the Level III application.
- **VMGO** — Vision and Mission only, linked to the official CTU Moalboal page. The old “By the end of 2024” goals are deliberately not published.

A missing row is intentional. It says **In preparation** and does not pretend to work.

## Run locally

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Add the Supabase values to `.env` if you are working on the content layer. The public site falls back to static data when the env vars are absent. See [`supabase/README.md`](supabase/README.md) for the project setup, migration, auth roles, and RLS smoke test.

Check and build:

```bash
pnpm check
pnpm build
```

Preview the exact prerendered output:

```bash
node scripts/serve-static.mjs .vercel/output/static 4173
```

Then open `http://127.0.0.1:4173`.

## Admin editing

The admin lives at `/admin/login`. After sign-in:

- `/admin` — dashboard
- `/admin/content` — list of editable blocks
- `/admin/content/[id]` — edit VMGO, hero copy, site wordings, or the carousel

The editor is split-view: fields on the left, **live preview** on the right. It also has:

- **Autosave** — draft saves after a short pause; the status shows Saving / Saved.
- **Preview home** — opens a full-page iframe of `/?preview=1`, which reads the draft values for signed-in staff.
- **Carousel upload** — images go to the public `public-images` bucket; captions, meta, alt text, and order are editable.

Each block has a **draft** and a **published** value:

- **Save draft** updates only the draft.
- **Submit for review** moves it to `in_review`.
- **Publish** copies the draft to the published value and writes a revision.

The public home reads `published_value` from `content_blocks` and caches the response for 60 seconds. A publish appears within about a minute. The preview route is `no-store` and only shows drafts to admin/focal/reviewer sessions.

## Editing content in code

Programs, areas, and documents still fall back to **`src/lib/data/accreditation.ts`**; campus defaults are in **`src/lib/data/site.ts`**. The database is the source of truth for the content blocks above.

See [CONTENT.md](CONTENT.md) for the full guide.

The short version for a current-visit link:

1. Find the area in `currentVisitAreasFrom(...)`.
2. Replace the `pending(...)` entry with `linked(...)`.
3. Paste the Drive URL as the fourth argument.
4. Run `pnpm check` and `pnpm build`.
5. Commit and push.

## Google Drive permissions

Every file and folder must be shared as **Anyone with the link — Viewer**. Test from a signed-out browser. A link that works for the task force but not for an evaluator is the most common failure in a digital dossier.

## Deploy

1. Push the repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Vercel detects SvelteKit; keep `pnpm build` and the default output.
4. Add `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `PUBLIC_SITE_URL` in **Settings → Environment Variables**.
5. Add the production domain under **Settings → Domains**.

The public pages are cached SSR once the content layer is wired; the admin is dynamic. The service-role key stays server-only.

## Project shape

```text
src/
  lib/
    components/site/     header, footer, carousel, spines, area table, document rows
    components/ui/       shadcn-svelte primitives
    data/                accreditation.ts, site.ts, types.ts
  routes/
    +page.svelte         campus landing
    [program]/           program volume, visit, areas, documents, records, about
supabase/
  migrations/            schema, RLS, storage, seed content
  README.md              setup, auth roles, workflow, smoke tests
scripts/
  serve-static.mjs       local preview for the Vercel static output
```

The old browser artifacts and screenshots are ignored. `.vercelignore` keeps them out of CLI deployments.

## Design

**Two Volumes, One Campus.** Maroon for BSIE, green for BSFI, deep petrol and salt paper. Bricolage Grotesque for display, Instrument Sans for body, IBM Plex Mono for metadata. The two spines are the program selector; the rest of the chrome is program-scoped.

The carousel uses official CTU Moalboal campus images by URL, with a text fallback if an image cannot load. It auto-advances slowly, pauses on hover/focus, has previous/pause/next controls, and respects `prefers-reduced-motion`.

The full brief is in [`docs/superpowers/specs/2026-10-21-aaccup-site-design.md`](docs/superpowers/specs/2026-10-21-aaccup-site-design.md).

## Before publishing

- [ ] `pnpm check` and `pnpm build` pass.
- [ ] The Supabase migration has run and the RLS smoke test passes.
- [ ] The first admin and focal accounts have the correct `app_metadata` role.
- [ ] Every linked document opens in a signed-out browser.
- [ ] The four current-visit areas match the official 2026 assignment.
- [ ] The previous 10-area pages are clearly the archive, not current evidence.
- [ ] The Level III visit wording matches the official status.
- [ ] The carousel images load on the production domain.
- [ ] The Vercel preview is tested on a phone.

Prepared for the Campus AACCUP Task Force, CTU Moalboal.

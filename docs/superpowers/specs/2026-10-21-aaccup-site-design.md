# CTU Moalboal AACCUP Evidence Site — Design

**Status:** Revised implementation — program-scoped IA
**Date:** 2026-10-21
**Owner:** CTU Moalboal MIS / AACCUP Task Force

## Revision — program-scoped architecture (2026-10-21)

The first build treated the site as one shared dossier with a program filter. That was wrong for the task force’s mental model. The implemented architecture is now:

- `/` is a campus landing page: the two volumes, campus carousel, CTU Vision and Mission, shared records, and campus contact.
- `/bsie` and `/bsfi` are separate volumes. The program selector is the only shared control.
- **Current visit** = four areas under review in 2026: Faculty Development, Instruction, Extension, Linkages. These are top-level links in each volume.
- **Previous visit: 10 areas** = the last survey’s recommendations and compliance record. These live in the `More` menu and on `/bsie/areas/...`.
- **Records** = certification, BOR, COPC, checklist. Per-program URL (`/bsie/records`), one shared data source.
- Documents search is scoped to the active program.
- The site says **Level III visit**, not “Level III accredited.” The official status page still lists BSFI and BSIE as Level II.
- VMGO publishes Vision and Mission only; the dated 2024 goals are omitted.
- The home carousel uses official campus images, pauses on hover/focus, has controls, and respects reduced motion.

The earlier sections of this document describe the visual system, content model, and quality bar that still apply. Route names, navigation, and the previous/current split are superseded by this revision.

## 1. Intent

Replace the current Google Sites accreditation pages with one fast, credible, and distinctly designed evidence portal for the coming AACCUP survey visit.

The site is a **front door to the evidence**, not a document storage system. Every document stays in Google Drive. The site holds the structure, titles, descriptions, and links that make the evidence easy to find.

The primary reader is an AACCUP accreditor who has limited time and needs to reach the right area and the right file in two clicks or fewer. The secondary readers are area chairs, faculty, and staff preparing the dossier.

## 2. Goals

- Make the ten AACCUP areas and their evidence obvious at a glance.
- Let a reader search or filter every document from one screen.
- Give each program (BSIE and BSFI, plus future programs) a clear, separate dossier.
- Feel like a serious institution, not a template or a marketing landing page.
- Load fast on a phone on campus Wi-Fi and on a laptop at the accreditation table.
- Keep content editable by one person in one file, with no CMS or database to maintain.
- Deploy to Vercel with no server state and effectively zero hosting cost.

## 3. Non-goals

- Uploading, storing, or previewing the actual documents.
- User accounts, roles, comments, approvals, or audit trails.
- A live Drive sync or automatic folder crawling.
- A dashboard of accreditation status that someone has to maintain separately.
- Replacing the official CTU website or the university records system.

## 4. Constraints and decisions

| Area | Decision |
| --- | --- |
| Framework | SvelteKit 2 + Svelte 5 (runes) |
| UI | shadcn-svelte + Tailwind CSS |
| Hosting | Vercel, fully prerendered static pages |
| Data | Typed TypeScript data module, committed to the repo |
| Documents | Google Drive links only; no files in the repo |
| Database | None. There is no mutable server data. |
| Search | Client-side over the static document index |
| Analytics | None in v1 (privacy and simplicity) |

**Why no database:** the content changes a few times before a survey, not thousands of times a day. A static data file is faster, cheaper, safer, and easier to back up than a database. Git history is the audit trail. If non-technical staff need to edit content later, a published Google Sheet can become a build-time data source without adding a database.

**Drive permission requirement:** every linked file and folder must be shared as **Anyone with the link — Viewer**. A private link will fail for accreditors even if it works for the person who copied it.

## 5. Information architecture

```
/                                   Home — cover sheet + area index + featured evidence
/programs/[program]                 Program dossier (bshm, bsfi)
/programs/[program]/areas/[area]    One AACCUP area and its documents
/documents                          Searchable index of every document
/resources                          Institutional documents (certification, BOR, COPC, etc.)
/about                              About the survey, the campus, and the team
```

Global elements:

- Compact top bar with the CTU Moalboal mark, program switcher, Documents, Resources, and a search trigger.
- A slim "dossier rail" on desktop showing the ten areas with numbers and document counts.
- Mobile: a sheet menu with the same index, plus a sticky "Find a document" action.
- Footer with the campus name, survey year, MIS credit, and a plain-language note that documents open in Google Drive.

## 6. Page behaviour

### Home

The first screen is a **cover sheet**, not a carousel. It names the accreditation, the program in focus, the survey window, and the state of the dossier. A program switch changes the cover data and the area index without a page reload.

Below the cover:

1. **Area index** — ten rows, not ten identical cards. Each row has the area number, title, document count, last update, and a thin completion rule. The row is the link.
2. **Recently updated evidence** — a short ledger of documents, with area and file type.
3. **Institutional documents** — certification, BOR resolution, COPC, checklist, additional documents.
4. **About the visit** — a brief, readable note and the accreditation focal person's contact.

### Program page

- Program name, degree, accreditation level, and survey window.
- A one-paragraph description written for an evaluator, not a brochure.
- The ten-area index with progress counts.
- Program-level sections: curriculum and instruction, extension, faculty development, linkages, checklist.
- A "download the checklist" action when a checklist exists.

### Area page

- Breadcrumb: Program / Area.
- A large area number as a structural marker, the area title, and a one-line description.
- Grouped documents:
  - Recommendations
  - Compliance / extent of compliance report
  - Supporting evidence
  - Presentations and annexes (only when present)
- Each document row shows title, format, area, and updated date, and opens Drive in a new tab.
- Previous / next area at the bottom.
- If an area has no documents yet, an honest empty state: "Evidence for this area is being prepared. Contact the area chair." Never a dead "Coming soon" card.

### Documents

- One search field, with `/` as the keyboard shortcut.
- Filters: program, area, document type.
- Result count and a clear "reset" action.
- Results as a dense, scannable table/list, not cards.
- The URL keeps the query and filters so a link can be shared with a colleague.

## 7. Content model

```ts
type Program = {
  slug: string;
  code: string;
  name: string;
  degree: string;
  surveyYear: number;
  surveyWindow: string;
  accreditationLevel: string;
  summary: string;
  areas: Area[];
};

type Area = {
  number: number;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  documents: Document[];
};

type Document = {
  id: string;
  title: string;
  kind: 'recommendation' | 'compliance' | 'supporting' | 'checklist'
      | 'presentation' | 'institutional' | 'form';
  format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'folder' | 'link';
  driveUrl?: string;
  status: 'linked' | 'pending';
  updated?: string;   // ISO date
  note?: string;
};
```

All content lives in `src/lib/data/accreditation.ts`. A short `CONTENT.md` explains how to add a program, area, or document. The Drive URL is the only thing that must change when a file is replaced; the site never stores the file itself.

Initial seed content comes from the public 2024 BSFI pages: ten areas, plus certification, BOR resolution, COPC, extension, library, consortia/linkages, and additional documents. BSIE is seeded with the same ten-area structure and clearly marked pending links until the task force supplies its Drive folders. BSFI and BSIE are both **Level III** visits. Links are sample content until the task force supplies the coming survey's Drive folders.

## 8. Visual direction

**Concept:** *Two Volumes, One Record.* The site is a bound accreditation dossier with two volumes on the shelf: BSIE in maroon, BSFI in green. The page should feel catalogued, weighted, and calm — the opposite of a folder full of unnamed PDFs.

The visual language comes from the physical dossier and from Moalboal's working coast: folder tabs, book spines, ruled ledgers, chart lines, and evidence stamps. Each program owns one accent colour. The colours never compete on the same surface except in the program switcher, where a small spine mark identifies each volume. It is not a generic "university blue" site and it is not a SaaS dashboard.

### Palette

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#082A2C` | Primary text, deep hero ground |
| `--ink-soft` | `#335052` | Secondary text |
| `--salt` | `#EDF1EA` | Page ground (cool, not cream) |
| `--paper` | `#F8FAF5` | Raised surfaces, document rows |
| `--rule` | `#082A2C1F` | Hairlines and dividers |
| `--bsie` | `#7A1E2B` | BSIE volume accent (maroon) |
| `--bsie-soft` | `#F1E2E4` | BSIE tinted surfaces |
| `--bsfi` | `#1D5B3A` | BSFI volume accent (green) |
| `--bsfi-soft` | `#E2EDE4` | BSFI tinted surfaces |
| `--signal` | `#C9973A` | Focus ring, "pending link" marker only |

The active program accent is exposed as `--accent`, `--accent-soft`, and `--accent-ink` on the program and area pages. Neutral chrome stays ink/salt so the two volumes remain distinct. No gradients as decoration.

### Typography

- **Display:** Bricolage Grotesque, 600–800, tight tracking (`-0.035em`), large sizes. Used for the cover title, area numbers, and section headings.
- **Body/UI:** Instrument Sans, 400–600. Generous line height, maximum line length around 68 characters.
- **Metadata:** IBM Plex Mono, 400–500, small. Used only for area codes, document formats, and dates — not for whole labels.

The type scale is fluid with `clamp()`, from a 15px body on mobile to 17px on desktop. Headings use `text-wrap: balance`.

### Layout

- 12-column grid, `max-width: 1240px`, asymmetric: a 220px index rail and a content column.
- Corners are 2–4px, like a folder, not 16px like a SaaS card.
- Borders and offset rules carry hierarchy; shadows are nearly absent.
- The hero is a full-bleed deep-petrol field with a fine contour drawing of the coastline. The drawing is generated as inline SVG, so there is no image to load and it stays crisp.
- A vertical spine label (`CTU MOALBOAL / AACCUP`) runs along the left edge on wide screens, like the spine of a bound report.
- Two oversized book spines sit on the right of the hero: maroon BSIE and green BSFI. Each carries the program code, degree, level, and an "Open volume" affordance. They are the only saturated blocks on the page.
- Section rhythm alternates salt ground, paper panels, and hairline rules. No repeated card grid.

### Signature moments

1. **The shelf:** the hero's two spines are slightly offset, like books. Hovering or focusing one lifts it 6px and reveals the full program name; clicking opens that program's dossier. On mobile they become two horizontal tabs with a maroon/green spine edge.
2. **Area index:** hovering or focusing a row tints it with the active program's soft colour and slides the arrow; the row itself is the affordance. Numbers are set in the display face and aligned like a ledger.
3. **Document rows:** file format is a small stamped label, not a colourful icon. A linked row opens Drive; a pending row is dashed and says "Link pending" rather than pretending to work. A tiny "opens in Drive" note appears on focus.
4. **Empty and error states:** written in plain language, with the area chair's contact rather than a generic "no data".

### Motion and accessibility

- One orchestrated hero reveal; everything else responds to the reader.
- All motion respects `prefers-reduced-motion`.
- Visible focus rings in `--signal` at 2px offset.
- Program colours are never used for body text; they are checked against WCAG AA for large text and UI edges.
- Full keyboard navigation, skip link, semantic headings, and accessible names for icon buttons.
- Responsive from 320px up; the index rail collapses into a sheet.

## 9. Technical shape

```
src/
  lib/
    components/
      site/            Header, ProgramSwitcher, AreaRail, DocumentRow, CoverSheet
      ui/              shadcn-svelte primitives
    data/
      accreditation.ts Program/area/document content
      site.ts          Campus name, survey copy, contact, nav
    search.ts          Client-side document search
  routes/
    +layout.svelte
    +page.svelte
    programs/[program]/+page.svelte
    programs/[program]/areas/[area]/+page.svelte
    documents/+page.svelte
    resources/+page.svelte
    about/+page.svelte
```

- `export const prerender = true` in the root layout.
- `@sveltejs/adapter-vercel` for deployment; every route is static.
- shadcn-svelte components added only as needed: button, badge, input, sheet, separator, tooltip, and a small command/search dialog if it earns its place.
- No client-side data fetching, no API routes, no environment variables required for v1.
- SEO: per-page title and description, Open Graph image generated from the cover design, `sitemap.xml`, and JSON-LD for the institution.
- A `README.md` with local setup, content editing, Drive permissions, and Vercel deployment steps.

## 10. Acceptance criteria

- All pages render at 320px, 768px, 1280px, and 1440px without horizontal scroll.
- An evaluator can go from the home page to any area's documents in two clicks.
- Every document row opens the correct Drive URL in a new tab.
- Search and filters work without a network request and can be deep-linked.
- `pnpm check`, `pnpm build`, and a Lighthouse run pass with no console errors; performance and accessibility scores are both at least 95 on the home and area pages.
- The site deploys to Vercel from the repo with no database, no server env vars, and no Drive API key.
- Content can be updated by editing one TypeScript file and pushing; the Vercel build redeploys automatically.

## 11. Open questions for the task force

1. Confirm the exact survey year/window for the BSIE and BSFI Level III visits.
2. Is there one new Drive folder for each program, or should the site keep the existing 2024 BSFI links as seed content?
3. Is there an official CTU Moalboal seal and a campus photo we may use, or should the design stay typographic with the contour artwork?
4. What domain should it live on — a `ctu.edu.ph` subdomain, or a `*.vercel.app` address for the meantime?

## 12. Build sequence after approval

1. Scaffold SvelteKit + Tailwind + shadcn-svelte; set the design tokens and fonts.
2. Build the content model and seed the BSHM/BSFI data.
3. Build the cover, area index, program, area, documents, resources, and about pages.
4. Add search, filters, responsive navigation, and accessibility passes.
5. Run checks and a production build; capture screenshots at three widths.
6. Deploy a Vercel preview and hand over the URL plus the content guide.

# Editing the AACCUP dossier

Content is in **`src/lib/data/accreditation.ts`**. Campus copy, VMGO, carousel slides, and contact details are in **`src/lib/data/site.ts`**.

No database, no admin screen. The content is TypeScript, checked at build time, and deployed with the site.

---

## 1. The two layers

Do not mix them.

### Current visit

The four areas under review in 2026:

```ts
currentVisitAreas: currentVisitAreasFrom('bsie')
```

Each area has `number`, `slug`, `title`, `shortTitle`, `description`, `focus`, and `documents`. It appears in the header and on the program home.

### Previous visit — 10 areas

The last survey’s recommendations:

```ts
areas: areasFrom(bsieAreaDocs)
```

These pages are explicitly framed as the archive. They should contain recommendations and compliance reports from the previous survey, not current-visit evidence.

### Shared records

`institutionalDocuments` is used by both `/bsie/records` and `/bsfi/records`. The URL is program-scoped; the data is shared.

---

## 2. Document shape

```ts
{
  id: 'bsie-visit-instruction-narrative',    // unique, stable, kebab-case
  title: 'Instruction — Narrative report',
  kind: 'narrative',                          // recommendation | compliance | narrative | supporting | checklist | presentation | institutional | form
  format: 'pdf',                              // pdf | docx | xlsx | pptx | folder | link
  status: 'linked',                           // linked | pending
  driveUrl: 'https://drive.google.com/file/d/FILE_ID/view',
  updated: '2026-09-30',                      // optional
  note: '...'                                 // optional
}
```

Helpers:

```ts
linked('id', 'Title', 'narrative', driveFile('FILE_ID'), {
  updated: '2026-09-30',
  note: 'Optional note.'
});

pending('id', 'Title', 'narrative', 'Why it is not linked yet.');
```

A pending row is not clickable and says **In preparation**.

---

## 3. Replace a current-visit link

The current-visit placeholder generator is `currentVisitAreasFrom(prefix)` near the top of `accreditation.ts`.

For BSIE, find:

```ts
pending(
  'bsie-visit-instruction-narrative',
  'Instruction — Narrative report',
  'narrative',
  'The narrative for this current-visit area is being prepared by the task force.'
)
```

Replace it with:

```ts
linked(
  'bsie-visit-instruction-narrative',
  'Instruction — Narrative report',
  'narrative',
  driveFile('1AbCdEfGhIjKlMnOpQrStUvWxYz'),
  { updated: '2026-10-15' }
)
```

Do the same for the supporting evidence and evidence matrix rows.

### Getting the file ID

```text
https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view
                                  └──────── this is the ID ────────┘
```

For Google Docs, paste the full URL and set `format: 'docx'`. For a folder, use the folder URL and `format: 'folder'`.

---

## 4. Replace a previous-visit link

The previous 10 areas use `bsfiAreaDocs` and `bsieAreaDocs`. They are seeded with the 2024 public BSFI index. Replace the `linked(...)` URL when the current archive link changes.

The previous pages must stay labelled as the previous visit. Do not paste current-visit evidence into them.

---

## 5. Add a document

Inside the relevant `documents` array, add another object. Keep the `id` unique across the whole site.

```ts
linked(
  'bsie-visit-instruction-syllabi',
  'Instruction — Course syllabi, 2023–2026',
  'supporting',
  driveFile('FILE_ID'),
  { format: 'folder', updated: '2026-08-20' }
)
```

It appears on the area page, in the scoped document search, and in the relevant counts.

---

## 6. Add or rename a current-visit area

Edit `CURRENT_VISIT_DEFINITIONS` near the top of `accreditation.ts`:

```ts
{
  number: 5,
  slug: 'research',
  title: 'Research',
  shortTitle: 'Research',
  description: '...',
  focus: 'What the evaluator will look for.'
}
```

The header, program home, current-visit pages, and search pick it up automatically. Keep `number` and `slug` unique.

If the four current areas change, update `CURRENT_VISIT_DEFINITIONS` only. Do not rename the 10-area archive to match them; the two layers are separate by design.

---

## 7. Change the visit wording

The site currently says **Level III visit** and **Applying for Level III accreditation**.

- Whole-site copy: `src/lib/data/site.ts` → `level`, `statusNote`, `surveyYear`.
- Per-program copy: `src/lib/data/accreditation.ts` → each program’s `visitLevel`, `level`, `statusNote`, `surveyYear`, `previousVisitLabel`.

Do not change this to “Level III accredited” unless the official AACCUP status supports it. The official campus page still lists BSFI and BSIE as Level II.

---

## 8. VMGO and campus details

- `vmgo.vision`, `vmgo.mission`, `vmgo.source` in `site.ts`.
- Only Vision and Mission are published. The old “By the end of 2024” goals are intentionally omitted until the campus issues the updated VMGO.
- `campusUpdates` holds the carousel slides. Each slide needs `src`, `alt`, `caption`, and `meta`.
- `site.address`, `site.phone`, `site.email`, `site.website`.

If an official campus image URL stops working, replace it in `campusUpdates`. The carousel has a text fallback if the image fails.

---

## 9. Drive permissions

For every file and folder:

1. Right-click → **Share**.
2. **General access** → **Anyone with the link**.
3. Role → **Viewer**.
4. Copy the link.
5. Test it in an incognito window while signed out.

If a file is inside a restricted folder, share the folder too.

---

## 10. Checks before you commit

```bash
pnpm check
pnpm build
node scripts/serve-static.mjs .vercel/output/static 4173
```

Then verify:

- The new row appears under the right current-visit area.
- The row opens the correct Drive file.
- The program selector preserves the page when switching BSIE ↔ BSFI.
- The `More` menu shows the 10 previous areas.
- The mobile sheet groups Current visit first and Previous visit second.
- The document search is scoped to the active program.
- The page still works at 390px wide.

---

## 11. What not to edit

- `src/lib/components/ui/**` — generated shadcn-svelte primitives.
- `src/app.css` — design tokens; check contrast if you change colours.
- `.vercel/output/**` — build output.
- The two-layer copy: current visit vs previous visit. That distinction is the whole navigation model.

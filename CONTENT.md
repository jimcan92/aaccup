# Editing the AACCUP dossier

All content is in **`src/lib/data/accreditation.ts`**. Site-wide copy is in **`src/lib/data/site.ts`**.

There is no database and no admin screen. The content is TypeScript, checked at build time, and deployed with the site.

---

## 1. The document shape

```ts
{
  id: 'bsie-a1-rec',                       // unique, stable, kebab-case
  title: 'Area 1 — Recommendations 1–8',   // shown in the row
  kind: 'recommendation',                  // recommendation | compliance | narrative | supporting | checklist | presentation | institutional | form
  format: 'pdf',                           // pdf | docx | xlsx | pptx | folder | link
  status: 'linked',                        // linked | pending
  driveUrl: 'https://drive.google.com/file/d/FILE_ID/view',
  updated: '2026-09-30',                   // optional, ISO date
  note: 'Recommendation and compliance evidence are combined in one file.' // optional
}
```

Use the helpers at the top of `accreditation.ts`:

```ts
linked(
  'bsie-a1-rec',
  'Area 1 — Recommendations 1–8',
  'recommendation',
  driveFile('FILE_ID'),
  { updated: '2026-09-30', note: 'Combined recommendation and compliance file.' }
)
```

```ts
pending(
  'bsie-a1-rec',
  'Area 1 — Recommendations',
  'recommendation',
  'Drive link to be supplied by the area chair.'
)
```

A pending row is not clickable and shows **Link pending**. A linked row opens Drive in a new tab.

---

## 2. Replace a pending BSIE link

This is the most common task before the visit.

1. Open `src/lib/data/accreditation.ts`.
2. Find the `bsieAreaDocs` block near the bottom.
3. Locate the `pending(...)` entry for the area, for example:

```ts
pending('bsie-a1-rec', 'Area 1 — Recommendations', 'recommendation')
```

4. Replace it with a `linked(...)` call:

```ts
linked(
  'bsie-a1-rec',
  'Area 1 — Recommendations 1–8',
  'recommendation',
  driveFile('1AbCdEfGhIjKlMnOpQrStUvWxYz'),
  { updated: '2026-10-15' }
)
```

5. Do the same for the compliance row.
6. Run `pnpm check` and `pnpm build`.
7. Commit and push.

### Getting the file ID

From a Google Drive URL:

```
https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing
                                  └────────── this is the ID ──────────┘
```

Use `driveFile('1AbCdEfGhIjKlMnOpQrStUvWxYz')` or paste the full `/view` URL as the fourth argument. Both work.

For a Google Docs file, copy the full URL and use `format: 'docx'`:

```ts
linked('bsie-a1-rec', 'Area 1 — Recommendations', 'recommendation',
  'https://docs.google.com/document/d/FILE_ID/edit', { format: 'docx' })
```

For a Drive folder, use the folder URL and `format: 'folder'`:

```ts
linked('bsie-a1-rec', 'Area 1 — Evidence folder', 'supporting',
  'https://drive.google.com/drive/folders/FOLDER_ID', { format: 'folder' })
```

---

## 3. Add a document to an existing area

Inside the relevant `bsieAreaDocs` or `bsfiAreaDocs` array, add another object:

```ts
linked(
  'bsfi-a3-syllabi',
  'Area 3 — Course syllabi, 2023–2026',
  'supporting',
  driveFile('FILE_ID'),
  { format: 'folder', updated: '2026-09-12' }
)
```

Keep `id` unique across the whole site. Prefix it with the program and area.

---

## 4. Add a program-wide document

Program-wide evidence lives in `bsieProgramDocs` or `bsfiProgramDocs`:

```ts
linked(
  'bsfi-library-inventory',
  'Library — Inventory of book materials',
  'supporting',
  driveFile('FILE_ID'),
  { format: 'xlsx', updated: '2026-08-20' }
)
```

These rows appear on the program page and in the global document index.

---

## 5. Add an institutional record

Institutional records are in `institutionalDocuments`:

```ts
linked(
  'inst-certification',
  'AACCUP certification',
  'institutional',
  driveFile('FILE_ID'),
  { updated: '2026-10-01' }
)
```

They appear on `/resources` and on the home page's institutional strip.

---

## 6. Change the survey year, level, or copy

- **Survey year and level for the whole site:** `src/lib/data/site.ts` → `surveyYear`, `level`.
- **Per-program year and level:** `src/lib/data/accreditation.ts` → each program's `surveyYear`, `surveyWindow`, `level`.
- **Campus name, address, intro, contact note:** `src/lib/data/site.ts`.
- **Program summaries and titles:** `src/lib/data/accreditation.ts` → `summary`, `summaryTitle`.
- **Area descriptions:** `AREA_DEFINITIONS` near the top of `accreditation.ts`. These are shared by both programs.

If the survey year changes, update both `site.ts` and each program so the cover, footer, and program pages agree.

---

## 7. Add a program

1. Add a new slug to `ProgramSlug` in `src/lib/data/types.ts`, for example `'bsit'`.
2. Create an area document map (or reuse `pendingAreaDocs`).
3. Add an object to the `programs` array with `slug`, `code`, `name`, `degree`, `level`, `surveyYear`, `surveyWindow`, `accent`, `accentSoft`, `accentInk`, `summary`, `summaryTitle`, `areas`, and `programDocuments`.
4. The header, home spine shelf, program pages, area pages, and document index pick it up automatically.
5. Add its pages to any external links or printed materials.

Use an accent colour that is clearly distinct from maroon and green. Keep the accent for UI edges and large text, not body copy.

---

## 8. Drive permissions

For every file and folder:

1. Right-click → **Share**.
2. Under **General access**, choose **Anyone with the link**.
3. Set the role to **Viewer**.
4. Copy the link.
5. Test it in a private/incognito window while signed out.

If the file is in a shared drive or a folder with restricted access, check the folder's sharing too. A file can look public while its folder is not.

---

## 9. Checks before you commit

```bash
pnpm check
pnpm build
node scripts/serve-static.mjs .vercel/output/static 4173
```

Then open `http://127.0.0.1:4173` and check:

- The new row appears under the right area.
- The row opens the correct Drive file.
- The filter `program=…&area=…` shows the row.
- The mobile layout still works at 390px wide.

---

## 10. What not to edit

- `src/lib/components/ui/**` — generated shadcn-svelte primitives. Regenerate with the CLI if you need to update them.
- `src/app.css` — design tokens. Changing the palette is possible, but check contrast and the program accents.
- `.vercel/output/**` — build output. Never edit by hand.

If you need a new UI primitive, use:

```bash
pnpm exec shadcn-svelte add <component>
```

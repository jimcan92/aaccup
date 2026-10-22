# Supabase setup — Phase 1

This is the content layer for the AACCUP 2026 site. The public UI is already built; this adds the database, auth, roles, image storage, and the draft → review → publish foundation.

**Run order:** SQL migration → auth settings → first admin → env vars → RLS smoke test.

---

## 1. Run the migrations

1. Open the Supabase project.
2. Go to **SQL Editor → New query**.
3. Paste the whole of [`migrations/202610210001_init.sql`](migrations/202610210001_init.sql). Run it once.
4. New query again: paste [`migrations/202610210002_workflow.sql`](migrations/202610210002_workflow.sql). Run it once.
5. New query again: paste [`migrations/202610210003_public_content_security.sql`](migrations/202610210003_public_content_security.sql). Run it once.

Run them in order. `0002` adds program status, editor attribution, the workflow guards, the submit/review/publish RPCs, and the admin role-sync function. `0003` revokes direct anon reads on `content_blocks` and makes `published_content()` the only public read path, so drafts are not exposed through the REST API.

### CLI option

If the Supabase CLI is installed and logged in:

```bash
supabase link --project-ref brtsnluqccoqhlgheodg
supabase db push
```

`link` prompts for the database password, then `db push` applies both files in order. The password is the **database password**, not the anon or service-role key.

It creates:

| Table | Purpose |
|---|---|
| `programs` | BSIE and BSFI volume metadata |
| `areas` | Current 4 and previous 10 areas |
| `documents` | Drive links and workflow status |
| `content_blocks` | Editable site copy, VMGO, hero, carousel |
| `profiles` | User role and program assignment |
| `revisions` | Audit snapshots |
| `publish_log` | What went live and who published it |

It also creates the `public-images` storage bucket and all RLS policies.

## 2. Sign-in: CTU Accounts SSO

Staff do **not** sign in with Supabase Auth. The admin uses the shared CTU Accounts session
(`accounts.ctu-moalboal.online`), the same one as the other campus systems:

1. The browser sends the `ctu.session_token` cookie, which is scoped to `.ctu-moalboal.online`.
2. The server forwards only that cookie to Accounts' `/api/auth/get-session`.
3. The SSO email must exactly match a row in `public.profiles`. Nobody is added automatically.
4. The server gets a real Supabase session for that user: it asks Supabase Auth for a one-time
   login link (`generateLink`, no email is sent) and redeems it right away. The token is signed by
   the project's own keys, so it survives JWT key rotation. Role, program, and area come from
   `app_metadata`, so every RLS policy and workflow RPC applies unchanged. The session lives in an
   httpOnly cookie and is refreshed when it expires or the person's role changes.

This only works on a `*.ctu-moalboal.online` host. On `localhost`, set `AACCUP_DEV_SSO_EMAIL`
in `.env`; it is ignored in production builds.

In **Authentication → Providers → Email**, keep the Email provider **enabled** (the server's
one-time login links need it) but turn off **Allow new users to sign up**. Auth users are created
only by an admin from **Admin → People**.

## 3. Add the first admin

Each person needs an `auth.users` row (the identity anchor) and a profile with a role. After the
first admin exists, everyone else is added from **Admin → People**.

For the very first admin, in **Authentication → Users → Add user**, create a user with their CTU
email (no password needed, tick *Auto confirm*), copy the UUID, then run:

```sql
update public.profiles
set role = 'admin', full_name = 'Campus MIS'
where id = '00000000-0000-0000-0000-000000000000';

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = '00000000-0000-0000-0000-000000000000';
```

Roles take effect on the next request. There is no Supabase session to sign out of.

## 4. Environment variables

Copy `.env.example` to `.env` locally, and add the same values in **Vercel → Settings → Environment Variables**:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PUBLIC_SITE_URL=https://aaccup.ctu-moalboal.online
ACCOUNTS_URL=https://accounts.ctu-moalboal.online
```


`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `PUBLIC_`, never import it into a client component, and never paste it in chat.

## 5. Seed the programs and areas

`0001` seeds the editable copy and carousel in `content_blocks`; `0002` seeds the BSIE and BSFI program rows. The area and document rows start empty. Two options:

- **Admin UI (next phase):** the focal person creates them in `/admin`.
- **Seed script:** use the service role key to import the existing TypeScript data. This is the faster bridge; it needs the project keys first.

The public site will keep falling back to the static TypeScript data until the database rows exist and the read layer is wired.

## 6. RLS smoke test

In SQL Editor, run as the `anon` role:

```sql
set role anon;
select key, published_value from public.content_blocks where status = 'published' limit 5;
select * from public.areas where status = 'published' limit 5;
```

Then try a write as `anon`; it must fail:

```sql
insert into public.content_blocks (key, label, draft_value)
values ('test.anon', 'Anon test', 'nope');
```

For an area chair, the same test should only return that chair’s program. For a reviewer, reads should work and writes should fail.

## 7. Storage

The migration creates:

- bucket: `public-images`
- public read
- authenticated write for admin, focal, and area chair
- delete for admin and focal

Upload a test image in **Storage → public-images**, copy the public URL, and use it in a `content_blocks` image value or the carousel JSON.

## 8. Content model

`content_blocks` is the flexible layer:

| Key | Type | Used for |
|---|---|---|
| `site.title` | text | Page title |
| `site.description` | textarea | Meta description |
| `site.intro` | textarea | Home intro |
| `site.status_note` | text | “Applying for Level III accreditation” |
| `site.contact_note` | textarea | Contact guidance |
| `site.address` / `phone` / `email` | text | Campus contact |
| `home.hero.title` | text | Hero headline |
| `home.hero.intro` | textarea | Hero subcopy |
| `vmgo.vision` / `vmgo.mission` | textarea | VMGO |
| `vmgo.source` | url | Official VMGO link |
| `home.carousel` | json | Array of `{src, alt, caption, meta}` |

Each block has:

- `draft_value` — what the focal/area chair edits.
- `published_value` — what the public site reads.
- `status` — `draft`, `in_review`, `approved`, `published`, `archived`.

Publishing copies `draft_value` to `published_value`, sets `status = 'published'`, and writes a revision.

## 9. Workflow

```text
draft → in_review → approved → published
   ↑         │          │
   └─────────┴──────────┘  (return / revise)
```

- Area chair: creates/edits drafts for their program; submits for review.
- Focal: edits all, reviews, publishes.
- Reviewer: reads and approves/returns; no direct writes.
- Admin: users, roles, settings, recovery.

`revisions` stores a JSON snapshot of the entity on publish. `publish_log` records what went live and who did it.

### Workflow RPCs

Use these from the admin server actions; do not update `status` directly from the client.

```sql
select public.submit_content_block('<block-uuid>');
select public.review_content_block('<block-uuid>', true);
select public.publish_content_block('<block-uuid>');

select public.submit_area('<area-uuid>');
select public.publish_area('<area-uuid>');

select public.submit_document('<document-uuid>');
select public.publish_document('<document-uuid>');
```

`publish_content_block` copies `draft_value` to `published_value`, sets `published_at`, writes a revision, and writes a publish log entry.

The workflow guards stop an area chair from setting `approved` or `published` directly, even through the REST API.

### Admin role sync

`admin_set_role` updates both `profiles` and `auth.users.raw_app_meta_data` in one transaction:

```sql
select public.admin_set_role(
	'<user-uuid>',
	'area_chair',
	'<program-uuid>',
	null
);
```

The user must sign out and sign in again for the new JWT to carry the role.

## 10. Published content read

The public site should call:

```sql
select * from public.published_content();
```

It returns only `published` blocks. Published programs/areas/documents are read through their tables. Do not expose the `draft_value` to the public client.

## 11. Public delivery

Phase 1 public reads will use **SSR + 60-second cache**:

- SvelteKit reads published content from Supabase.
- Vercel caches the response for 60 seconds.
- A publish appears within a minute, with no rebuild.

Until the read layer is wired, the public site uses the static TypeScript content as a fallback. That fallback is intentional so the site still builds without Supabase env vars.

## 12. Backups

The Supabase free tier is not a backup strategy. Before each accreditation cycle:

- Export `content_blocks`, `programs`, `areas`, and `documents` as CSV/JSON.
- Keep the migration and seed script in Git.
- Use `revisions` to recover a published block.

## 13. What is built and what is next

Built:

- `/admin/login` — email/password and magic link.
- `/admin` — dashboard.
- `/admin/content` — site copy, VMGO, hero, carousel.
- Live block preview, full-page home preview (`/?preview=1`), autosave draft.
- Carousel image upload to `public-images`.
- Draft → review → publish for content blocks.
- Public home reads `published_content()` with 60s cache.

Next:

- `/admin/areas` and `/admin/documents` — area-chair CRUD.
- `/admin/users` — role and program assignment.
- Full draft/published versioning for areas and documents (their current workflow is row-level).
- Seed the existing programs/areas/documents into the database.

# Supabase setup — Phase 1

This is the content layer for the AACCUP 2026 site. The public UI is already built; this adds the database, auth, roles, image storage, and the draft → review → publish foundation.

**Run order:** SQL migration → auth settings → first admin → env vars → RLS smoke test.

---

## 1. Run the migration

1. Open the Supabase project.
2. Go to **SQL Editor → New query**.
3. Paste the whole of [`migrations/202610210001_init.sql`](migrations/202610210001_init.sql).
4. Run it once.

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

## 2. Auth settings

In **Authentication → URL Configuration**:

- **Site URL:** your production origin, for example `https://aaccup.vercel.app`
- **Redirect URLs:** add:
  - `https://aaccup.vercel.app/**`
  - `http://localhost:5173/**`

In **Authentication → Providers → Email**:

- Enable **Email**.
- Enable **Email + Password**.
- Enable **Magic Link** if you want the fallback.
- For a small campus team, disable “Confirm email” only if the accounts are created by an admin; otherwise keep it on.

## 3. Create the first admin

1. **Authentication → Users → Add user**.
2. Create the focal/admin account with an email and password.
3. Copy the user’s UUID.
4. Run this in SQL Editor, replacing the UUID and name:

```sql
update public.profiles
set role = 'admin', full_name = 'Campus MIS'
where id = '00000000-0000-0000-0000-000000000000';

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = '00000000-0000-0000-0000-000000000000';
```

The `app_metadata` role is what RLS reads. The `profiles.role` is for the admin UI.

> After changing `app_metadata`, the user must sign out and sign in again so the new JWT carries the role.

### Focal person

```sql
update public.profiles set role = 'focal' where id = '<uuid>';
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"focal"}'::jsonb
where id = '<uuid>';
```

### Area chair

Replace `<program-uuid>` with the BSIE or BSFI program ID:

```sql
update public.profiles
set role = 'area_chair', program_id = '<program-uuid>'
where id = '<uuid>';

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'area_chair', 'program_id', '<program-uuid>')
where id = '<uuid>';
```

### Reviewer

```sql
update public.profiles set role = 'reviewer' where id = '<uuid>';
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"reviewer"}'::jsonb
where id = '<uuid>';
```

## 4. Environment variables

Copy `.env.example` to `.env` locally, and add the same values in **Vercel → Settings → Environment Variables**:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PUBLIC_SITE_URL=https://aaccup.vercel.app
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `PUBLIC_`, never import it into a client component, and never paste it in chat.

## 5. Seed the programs and areas

The SQL seeds the editable copy and carousel in `content_blocks`, but the program/area/document rows start empty. Two options:

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

## 10. Public delivery

Phase 1 public reads will use **SSR + 60-second cache**:

- SvelteKit reads published content from Supabase.
- Vercel caches the response for 60 seconds.
- A publish appears within a minute, with no rebuild.

Until the read layer is wired, the public site uses the static TypeScript content as a fallback. That fallback is intentional so the site still builds without Supabase env vars.

## 11. Backups

The Supabase free tier is not a backup strategy. Before each accreditation cycle:

- Export `content_blocks`, `programs`, `areas`, and `documents` as CSV/JSON.
- Keep the migration and seed script in Git.
- Use `revisions` to recover a published block.

## 12. What is not built yet

This migration is the foundation. The next phase is the admin app:

- `/admin/login` — email/password and magic link.
- `/admin` — dashboard.
- `/admin/content` — site copy, VMGO, hero.
- `/admin/carousel` — image upload, reorder, alt text.
- `/admin/review` — draft → approved → published.
- `/admin/areas` and `/admin/documents` — area-chair CRUD.
- `/admin/users` — roles and program assignment.

The public site currently uses the static data fallback; do not expect edits to appear until the read layer and admin are wired.

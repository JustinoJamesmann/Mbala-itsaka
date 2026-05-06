# Supabase Setup

## 1. Create a Supabase project

Create a project at https://supabase.com and open **Project Settings > API**.

## 2. Create `.env.local`

Create a local file named `.env.local` in the project root. Do not commit this file.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Run the database schema

Open **Supabase SQL Editor** and run the SQL in `supabase/schema.sql`.

## 4. Create users

Use the app seed route after adding your env values and running the schema:

```txt
POST /api/admin/seed
```

Default accounts used by the app:

- Admin: `bienvenuesweethome@gmail.com`
- Worker: `bshworker6@gmail.com`

If you manually created these users in Supabase Auth, make sure matching rows exist in the `profiles` table with roles `admin` and `worker`.

## 5. Backups

Supabase provides database backups by project plan. For manual emergency backup, use the app export route:

```txt
GET /api/admin/export
```

Only admins should access export routes.

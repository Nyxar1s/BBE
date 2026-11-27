# BBE Events: Next.js site

**Stack:** Next.js 15 (App Router) + Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Resend (email) · Cal.com or Calendly (scheduling)

| Area | Where |
|---|---|
| Public website | `src/app/page.tsx` and `src/components/site/` |
| Booking submission and emails | `src/app/actions.ts`, `src/lib/email.ts` |
| Admin dashboard | `src/app/admin/`: login, dashboard, new/all bookings, history, gallery |
| Admin protection | `src/middleware.ts` (session) and `src/lib/auth.ts` (`requireAdmin`) |
| Database setup | `supabase/schema.sql` |

## 1. Supabase (one time)

1. Create a project at <https://supabase.com>.
2. In **SQL Editor**, run all of `supabase/schema.sql`.
   If your project was set up before the separate Full Service and Half Service forms existed, also run `supabase/migrations/002_service_details.sql`.
3. Go to **Authentication → Users → Add user**, enter the owner's email and password, and tick *Auto Confirm User*. Then run:
   ```sql
   insert into public.admins (id, email)
   select id, email from auth.users where email = 'owner@example.com';
   ```
4. Go to **Authentication → Sign In / Providers → Email** and turn off *Allow new users to sign up*.

## 2. Resend (for email notifications)

1. Create an account at <https://resend.com> and create an API key.
2. Add and verify your domain under **Domains** (e.g. `bbeevents.com`).
   Until you do, Resend can only send to your own account email.
3. Set `EMAIL_FROM` to an address on that domain, e.g. `BBE Events <bookings@bbeevents.com>`.

When a client submits a booking, the owner gets an alert with an "Open in dashboard" button, and the client gets an acknowledgement. Each email's reply-to goes to the other person.

## 3. Scheduling (optional)

Create a consultation event on Cal.com or Calendly and put its link in `NEXT_PUBLIC_SCHEDULING_URL`. After submitting a booking, the client sees the scheduler with their name and email already filled in. The link is also included in their acknowledgement email.

## 4. Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000, admin at /admin
```

## 5. Deploy (Vercel recommended)

1. Push this project to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Add every variable from `.env.example` under **Environment Variables**, and set `NEXT_PUBLIC_SITE_URL` to the live address.
4. Click **Deploy**. Every push to `main` then redeploys automatically.
5. Optional: add a custom domain under **Settings → Domains**.
6. In Supabase, go to **Authentication → URL Configuration** and set *Site URL* to the live address.

Netlify and Cloudflare Pages also run Next.js, but Vercel needs no extra configuration.

## How the rules from the spec are enforced

- **No client accounts:** booking submission is a public server action.
- **Valid email required:** checked in the form, in the server action (zod), and by a database constraint.
- **New bookings start as Pending:** a database trigger forces it, whatever is sent.
- **Only admins see bookings and manage the gallery:** row-level security in Postgres, plus `requireAdmin()` on every admin page and action.
- **Photos appear only when published:** the public page queries `is_published = true`. Publishing, editing or deleting a photo refreshes the public page immediately.
- **Every status change is recorded:** a trigger writes to `booking_status_history`, which the booking page shows as a timeline.
- **Secrets stay on the server:** only the Supabase URL and anon key are public. `RESEND_API_KEY` is used on the server only.

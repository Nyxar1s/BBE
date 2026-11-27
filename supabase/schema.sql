-- =====================================================================
-- BBE Events — Supabase database setup
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query
-- It is safe to re-run (objects are created "if not exists" / replaced).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ADMINS
-- One row per authorized admin. Each row links to a Supabase Auth user.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text not null,
    full_name   text,
    created_at  timestamptz not null default now()
);

-- Returns true when the currently logged-in user is an admin.
-- Used by every security policy below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from public.admins where id = auth.uid());
$$;


-- ---------------------------------------------------------------------
-- 2. BOOKINGS
-- ---------------------------------------------------------------------
do $$ begin
    create type public.booking_status as enum
        ('Pending', 'Contacted', 'Confirmed', 'Rejected', 'Cancelled', 'Completed');
exception when duplicate_object then null; end $$;

create table if not exists public.bookings (
    id                uuid primary key default gen_random_uuid(),
    full_name         text not null check (char_length(full_name) between 1 and 120),
    email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    event_type        text not null check (char_length(event_type) <= 60),
    service_package   text not null check (service_package in ('Full Service', 'Half Service')),
    event_date        date not null,
    guest_count       integer check (guest_count is null or guest_count between 1 and 100000),
    meeting_date      date,
    meeting_time      time,
    meeting_location  text check (char_length(meeting_location) <= 80),
    details           text check (char_length(details) <= 5000),
    service_details   jsonb check (service_details is null or pg_column_size(service_details) <= 8000),
    status            public.booking_status not null default 'Pending',
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists bookings_status_idx     on public.bookings (status);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_service_package_idx on public.bookings (service_package);

-- For projects created before separate service forms existed:
alter table public.bookings add column if not exists service_details jsonb;


-- ---------------------------------------------------------------------
-- 3. BOOKING STATUS HISTORY
-- Filled automatically by a trigger — never written to directly.
-- ---------------------------------------------------------------------
create table if not exists public.booking_status_history (
    id          bigint generated always as identity primary key,
    booking_id  uuid not null references public.bookings (id) on delete cascade,
    old_status  public.booking_status,
    new_status  public.booking_status not null,
    changed_by  uuid references public.admins (id) on delete set null,
    changed_at  timestamptz not null default now()
);

create index if not exists booking_status_history_booking_idx
    on public.booking_status_history (booking_id, changed_at);


-- New public submissions are always Pending, whatever the browser sends.
create or replace function public.bookings_before_insert()
returns trigger
language plpgsql
as $$
begin
    if not public.is_admin() then
        new.status     := 'Pending';
        new.created_at := now();
    end if;
    new.updated_at := now();
    return new;
end;
$$;

create or replace function public.bookings_before_update()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- Log the initial status and every status change.
create or replace function public.bookings_log_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.booking_status_history (booking_id, old_status, new_status, changed_by)
        values (new.id, null, new.status, case when public.is_admin() then auth.uid() end);
    elsif new.status is distinct from old.status then
        insert into public.booking_status_history (booking_id, old_status, new_status, changed_by)
        values (new.id, old.status, new.status, case when public.is_admin() then auth.uid() end);
    end if;
    return new;
end;
$$;

drop trigger if exists bookings_before_insert on public.bookings;
create trigger bookings_before_insert
    before insert on public.bookings
    for each row execute function public.bookings_before_insert();

drop trigger if exists bookings_before_update on public.bookings;
create trigger bookings_before_update
    before update on public.bookings
    for each row execute function public.bookings_before_update();

drop trigger if exists bookings_log_status on public.bookings;
create trigger bookings_log_status
    after insert or update of status on public.bookings
    for each row execute function public.bookings_log_status();


-- ---------------------------------------------------------------------
-- 4. GALLERY
-- ---------------------------------------------------------------------
create table if not exists public.gallery (
    id            uuid primary key default gen_random_uuid(),
    storage_path  text not null,
    image_url     text not null,
    caption       text not null check (char_length(caption) <= 120),
    description   text check (char_length(description) <= 1000),
    is_published  boolean not null default false,
    sort_order    integer not null default 0,
    uploaded_by   uuid references public.admins (id) on delete set null,
    uploaded_at   timestamptz not null default now()
);

create index if not exists gallery_published_idx on public.gallery (is_published, sort_order, uploaded_at desc);


-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- The public (anon) key can ONLY: create a booking, and read published
-- gallery photos. Everything else requires a logged-in admin.
-- ---------------------------------------------------------------------
alter table public.admins                 enable row level security;
alter table public.bookings               enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.gallery                enable row level security;

-- admins: an admin can see the admin list (used to verify login)
drop policy if exists "admins read" on public.admins;
create policy "admins read" on public.admins
    for select to authenticated using (public.is_admin());

-- bookings: anyone may submit; only admins may read / change / delete
drop policy if exists "public can submit bookings" on public.bookings;
create policy "public can submit bookings" on public.bookings
    for insert to anon, authenticated with check (status = 'Pending' or public.is_admin());

drop policy if exists "admins read bookings" on public.bookings;
create policy "admins read bookings" on public.bookings
    for select to authenticated using (public.is_admin());

drop policy if exists "admins update bookings" on public.bookings;
create policy "admins update bookings" on public.bookings
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete bookings" on public.bookings;
create policy "admins delete bookings" on public.bookings
    for delete to authenticated using (public.is_admin());

-- status history: admins read only (rows come from the trigger)
drop policy if exists "admins read status history" on public.booking_status_history;
create policy "admins read status history" on public.booking_status_history
    for select to authenticated using (public.is_admin());

-- gallery: public sees published photos; admins manage everything
drop policy if exists "public reads published gallery" on public.gallery;
create policy "public reads published gallery" on public.gallery
    for select to anon, authenticated using (is_published or public.is_admin());

drop policy if exists "admins manage gallery" on public.gallery;
create policy "admins manage gallery" on public.gallery
    for all to authenticated using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. PHOTO STORAGE BUCKET
-- Public read (so the website can show images), admin-only write.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload gallery files" on storage.objects;
create policy "admins upload gallery files" on storage.objects
    for insert to authenticated with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "admins update gallery files" on storage.objects;
create policy "admins update gallery files" on storage.objects
    for update to authenticated using (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "admins delete gallery files" on storage.objects;
create policy "admins delete gallery files" on storage.objects
    for delete to authenticated using (bucket_id = 'gallery' and public.is_admin());


-- =====================================================================
-- 7. MAKE YOURSELF AN ADMIN  (run separately, after creating the user)
-- First: Authentication → Users → "Add user" → enter email + password.
-- Then replace the email below and run these two lines:
-- =====================================================================
-- insert into public.admins (id, email)
-- select id, email from auth.users where email = 'owner@example.com';

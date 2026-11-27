-- =====================================================================
-- Migration 002: service-specific booking answers
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Full Service and Half Service now have separate booking forms with
-- their own questions. Those answers are stored here as JSON, e.g.
--   Full: {"budget": "...", "venue_status": "...", "theme": "..."}
--   Half: {"booked_suppliers": ["Venue", "Catering"], "remaining_help": "..."}
-- =====================================================================

alter table public.bookings
    add column if not exists service_details jsonb;

alter table public.bookings
    drop constraint if exists bookings_service_details_size;
alter table public.bookings
    add constraint bookings_service_details_size
    check (service_details is null or pg_column_size(service_details) <= 8000);

create index if not exists bookings_service_package_idx on public.bookings (service_package);

-- Make the API pick up the new column immediately.
notify pgrst, 'reload schema';

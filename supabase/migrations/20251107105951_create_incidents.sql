-- =====================================================
-- INCIDENTS, CANCELLATIONS
-- =====================================================

-- Incidents (support issues, emergencies)
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  created_by uuid references auth.users(id),
  severity text check (severity in ('P0','P1','P2')) default 'P2',
  category text check (category in ('transport_delay','room_issue','billing','emergency','other')),
  description text not null,
  status text check (status in ('OPEN','ACK','RESOLVED','CANCELLED')) default 'OPEN',
  created_at timestamptz default now()
);

comment on table public.incidents is 'Trip issues and emergencies';
comment on column public.incidents.severity is 'P0=Emergency (5min SLA), P1=Urgent, P2=Normal';

-- Cancellation requests
create table public.cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  requested_by uuid references auth.users(id),
  reason text,
  policy_snapshot jsonb, -- cancellation policy at time of request
  status text check (status in ('REQUESTED','APPROVED','REJECTED','FINALIZED')) default 'REQUESTED',
  created_at timestamptz default now()
);

comment on table public.cancellations is 'Booking cancellation requests';

-- Indexes
create index idx_incidents_trip on incidents(trip_id);
create index idx_incidents_severity_status on incidents(severity, status);
create index idx_incidents_created_at on incidents(created_at desc);
create index idx_cancellations_booking on cancellations(booking_id);
create index idx_cancellations_status on cancellations(status);


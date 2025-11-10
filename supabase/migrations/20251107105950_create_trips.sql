-- =====================================================
-- TRIPS, TRIP MEMBERS, POSTS, DRIVER ASSIGNMENTS
-- =====================================================

-- Trips (created from confirmed booking)
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

comment on table public.trips is 'Active trips with communication channel';

-- Trip members (who can see this trip)
create table public.trip_members (
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text check (role in ('customer','operator','vendor','driver')) not null,
  display_name text not null, -- privacy: no phone numbers exposed
  primary key (trip_id, user_id)
);

comment on table public.trip_members is 'Trip participants (privacy: display name only)';

-- Trip posts (announcement channel)
create table public.trip_posts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text check (kind in ('announcement','itinerary','voucher','reminder')) not null,
  content jsonb not null, -- {title: '...', body: '...', attachments: [...]}
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text check (status in ('SCHEDULED','POSTED','CANCELLED')) default 'SCHEDULED',
  quick_actions jsonb default '[]'::jsonb, -- [{id:'confirm_pickup', label:'Confirm', type:'ack'}]
  created_at timestamptz default now()
);

comment on table public.trip_posts is 'Scheduled announcements for trip channel';

-- Trip post acknowledgments (quick action responses)
create table public.trip_post_acks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references trip_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  action_id text not null,
  payload jsonb, -- {location: 'lat,lng', note: '...'}
  created_at timestamptz default now(),
  unique(post_id, user_id, action_id)
);

comment on table public.trip_post_acks is 'User responses to quick actions';

-- Driver assignments (per day)
create table public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_no int not null,
  driver_id uuid references drivers(id),
  pickup_time timestamptz,
  pickup_location text,
  vehicle_note text,
  created_at timestamptz default now(),
  unique(trip_id, day_no)
);

comment on table public.driver_assignments is 'Daily driver assignments';

-- Indexes
create index idx_trips_booking on trips(booking_id);
create index idx_trips_dates on trips(start_date, end_date);
create index idx_trip_members_trip on trip_members(trip_id);
create index idx_trip_members_user on trip_members(user_id);
create index idx_trip_posts_trip on trip_posts(trip_id);
create index idx_trip_posts_scheduled on trip_posts(scheduled_at, status) where status = 'SCHEDULED';
create index idx_trip_post_acks_post on trip_post_acks(post_id);
create index idx_driver_assignments_trip on driver_assignments(trip_id);


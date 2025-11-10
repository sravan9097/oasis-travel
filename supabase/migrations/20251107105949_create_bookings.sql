-- =====================================================
-- BOOKINGS, PURCHASE ORDERS, VOUCHERS
-- =====================================================

-- Bookings table (created from accepted quote)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id),
  customer_id uuid references auth.users(id) not null,
  status text check (status in ('PENDING_VENDOR_CONFIRM','CONFIRMED','IN_TRIP','COMPLETED','CANCELLED')) default 'PENDING_VENDOR_CONFIRM',
  price_snapshot jsonb not null, -- frozen from quote.snapshot
  created_at timestamptz default now()
);

comment on table public.bookings is 'Confirmed bookings from accepted quotes';
comment on column public.bookings.price_snapshot is 'Immutable price data from quote';

-- Purchase Orders to vendors
create table public.pos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id) not null,
  items jsonb not null, -- [{day:1, type:'hotel', description:'...', qty:2, price:5000}]
  status text check (status in ('SENT','ACCEPTED','CONFIRMED','DECLINED')) default 'SENT',
  due_at timestamptz, -- SLA deadline (booking_created + vendor.sla_hours)
  messages jsonb default '[]'::jsonb, -- [{from:'operator', text:'...', at:'2024-01-01T10:00:00Z'}]
  created_at timestamptz default now()
);

comment on table public.pos is 'Purchase orders sent to vendors';
comment on column public.pos.due_at is 'SLA deadline for vendor response';

-- Vouchers (uploaded by vendors)
create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id) not null,
  file_url text not null, -- storage bucket path
  meta jsonb, -- {guest_name: 'John Doe', check_in: '2024-01-15', booking_id: 'ABC123'}
  verified boolean default false,
  created_at timestamptz default now()
);

comment on table public.vouchers is 'Vendor confirmation documents';
comment on column public.vouchers.meta is 'Parsed voucher details for verification';

-- Indexes
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_quote on bookings(quote_id);
create index idx_pos_booking on pos(booking_id);
create index idx_pos_vendor on pos(vendor_id);
create index idx_pos_due_at on pos(due_at) where status in ('SENT', 'ACCEPTED');
create index idx_vouchers_booking on vouchers(booking_id);
create index idx_vouchers_vendor on vouchers(vendor_id);


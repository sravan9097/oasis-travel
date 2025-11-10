-- =====================================================
-- QUOTES AND QUOTE ITEMS (VERSIONED)
-- =====================================================

-- Quotes table (versioned)
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  version int not null,
  parent_quote_id uuid references quotes(id),
  status text check (status in ('DRAFT','SENT','ACCEPTED','DECLINED','ARCHIVED')) default 'DRAFT',
  total_amount numeric default 0,
  currency text default 'INR',
  inclusions text,
  exclusions text,
  validity_date date,
  pdf_url text, -- storage bucket path
  snapshot jsonb, -- frozen copy when status = SENT (immutable)
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(lead_id, version)
);

comment on table public.quotes is 'Quote versions with immutable snapshots';
comment on column public.quotes.snapshot is 'Frozen quote data when sent - prevents retroactive changes';

-- Quote items (line items)
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  day_no int,
  item_type text check (item_type in ('hotel','cab','activity','misc')) not null,
  vendor_id uuid references vendors(id),
  description text not null,
  qty int default 1,
  unit_price numeric default 0,
  meta jsonb default '{}'::jsonb -- {room_type: 'deluxe', meal_plan: 'MAP'}
);

comment on table public.quote_items is 'Line items for quotes (day-wise breakdown)';

-- Indexes
create index idx_quotes_lead on quotes(lead_id);
create index idx_quotes_status on quotes(status);
create index idx_quotes_validity on quotes(validity_date);
create index idx_quotes_created_by on quotes(created_by);
create index idx_quote_items_quote on quote_items(quote_id);
create index idx_quote_items_vendor on quote_items(vendor_id);


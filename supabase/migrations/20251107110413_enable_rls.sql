-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.drivers enable row level security;
alter table public.leads enable row level security;
alter table public.request_docs enable row level security;
alter table public.rate_plans enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.bookings enable row level security;
alter table public.pos enable row level security;
alter table public.vouchers enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_posts enable row level security;
alter table public.trip_post_acks enable row level security;
alter table public.driver_assignments enable row level security;
alter table public.incidents enable row level security;
alter table public.cancellations enable row level security;

-- Admin settings: read-only for authenticated users
alter table public.admin_settings enable row level security;

-- Audit log: append-only, read by operators
alter table public.audit_log enable row level security;

-- Notifications: users see only their own
alter table public.notifications_outbox enable row level security;


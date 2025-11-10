-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common query patterns
-- (Most indexes are already created in their respective migration files)

-- Composite index for leads filtering
create index if not exists idx_leads_customer_stage on leads(customer_id, stage);

-- Composite index for quotes by lead and status
create index if not exists idx_quotes_lead_status on quotes(lead_id, status);

-- Composite index for bookings by customer and status
create index if not exists idx_bookings_customer_status on bookings(customer_id, status);

-- Composite index for trip posts by trip and status
create index if not exists idx_trip_posts_trip_status on trip_posts(trip_id, status);

-- Index for active incidents (most common query)
create index if not exists idx_incidents_active on incidents(trip_id, status) where status in ('OPEN', 'ACK');


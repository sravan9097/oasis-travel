-- =====================================================
-- ADMIN SETTINGS, AUDIT LOG, NOTIFICATIONS
-- =====================================================

-- Admin settings (feature flags, on-call info)
create table public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

comment on table public.admin_settings is 'System configuration and feature flags';

-- Pre-populate with defaults
insert into public.admin_settings (key, value) values
  ('on_call', '{"phone": "+91-9999999999", "hours": "24x7"}'::jsonb),
  ('feature_flags', '{"soft_onboarding": true, "masked_calling": false, "quick_actions": true}'::jsonb),
  ('sla_targets', '{"lead_to_quote": 24, "po_response": 24, "p0_incident": 5}'::jsonb);

-- Audit log (all mutations tracked)
create table public.audit_log (
  id bigserial primary key,
  actor uuid, -- auth.uid() who performed the action
  action text not null, -- 'create_lead', 'send_quote', 'accept_quote', etc.
  entity text not null, -- 'leads', 'quotes', 'bookings', etc.
  entity_id uuid,
  before jsonb, -- state before change
  after jsonb, -- state after change
  created_at timestamptz default now()
);

comment on table public.audit_log is 'Immutable audit trail for all mutations';

-- Notifications outbox (for push/email)
create table public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  kind text not null, -- 'quote_ready', 'trip_post', 'incident_update'
  title text not null,
  body text not null,
  data_json jsonb, -- deep link payload
  created_at timestamptz default now(),
  sent_at timestamptz
);

comment on table public.notifications_outbox is 'Pending notifications for delivery';

-- Indexes
create index idx_audit_log_actor on audit_log(actor);
create index idx_audit_log_entity on audit_log(entity, entity_id);
create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_notifications_outbox_user on notifications_outbox(user_id);
create index idx_notifications_outbox_pending on notifications_outbox(created_at) where sent_at is null;


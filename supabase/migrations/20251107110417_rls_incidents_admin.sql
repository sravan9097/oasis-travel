-- =====================================================
-- RLS: INCIDENTS, CANCELLATIONS, ADMIN
-- =====================================================

-- INCIDENTS: Trip members can create/view
create policy "Incidents viewable by trip members and operators"
  on incidents for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Trip members can create incidents"
  on incidents for insert
  with check (
    created_by = auth.uid()
    and is_trip_member(trip_id)
  );

create policy "Operators can update incidents"
  on incidents for update
  using (is_operator());

-- CANCELLATIONS: Customers create; operators manage
create policy "Cancellations viewable by customer and operators"
  on cancellations for select
  using (
    requested_by = auth.uid()
    or is_operator()
  );

create policy "Customers can request cancellations"
  on cancellations for insert
  with check (requested_by = auth.uid());

create policy "Operators can update cancellations"
  on cancellations for update
  using (is_operator());

-- ADMIN_SETTINGS: Everyone reads; only operators write
create policy "Admin settings readable by all"
  on admin_settings for select
  using (auth.uid() is not null);

create policy "Operators can update admin settings"
  on admin_settings for all
  using (is_operator());

-- AUDIT_LOG: Operators read; system writes
create policy "Audit log readable by operators"
  on audit_log for select
  using (is_operator());

-- NOTIFICATIONS_OUTBOX: Users see own notifications
create policy "Users see own notifications"
  on notifications_outbox for select
  using (user_id = auth.uid() or is_operator());

create policy "System can create notifications"
  on notifications_outbox for insert
  with check (true); -- Service role will write


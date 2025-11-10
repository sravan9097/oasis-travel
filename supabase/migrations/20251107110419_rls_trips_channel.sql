-- =====================================================
-- RLS: TRIPS, TRIP MEMBERS, POSTS
-- =====================================================

-- TRIPS: Trip members and operators see trips
create policy "Trips viewable by members and operators"
  on trips for select
  using (
    is_trip_member(id)
    or is_operator()
  );

create policy "Operators can manage trips"
  on trips for all
  using (is_operator());

-- TRIP_MEMBERS: Members see own trip members
create policy "Trip members viewable by members"
  on trip_members for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage trip members"
  on trip_members for all
  using (is_operator());

-- TRIP_POSTS: Trip members see posts
create policy "Trip posts viewable by members"
  on trip_posts for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage trip posts"
  on trip_posts for all
  using (is_operator());

-- TRIP_POST_ACKS: Users can ack their own actions
create policy "Users can view own acks"
  on trip_post_acks for select
  using (
    user_id = auth.uid()
    or is_operator()
  );

create policy "Users can create acks for their trip posts"
  on trip_post_acks for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from trip_posts
      where trip_posts.id = post_id
      and is_trip_member(trip_posts.trip_id)
    )
  );

-- DRIVER_ASSIGNMENTS: Trip members and operators see assignments
create policy "Driver assignments viewable by trip members"
  on driver_assignments for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage driver assignments"
  on driver_assignments for all
  using (is_operator());


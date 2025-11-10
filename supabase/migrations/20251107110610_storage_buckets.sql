-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create private buckets
insert into storage.buckets (id, name, public) values
  ('vouchers', 'vouchers', false),
  ('quotes', 'quotes', false),
  ('itineraries', 'itineraries', false),
  ('recaps', 'recaps', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;


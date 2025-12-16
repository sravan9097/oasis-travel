-- =====================================================
-- SEED DATA FOR DESTINATION PACKAGES
-- =====================================================
-- Sample packages for AI bot to suggest to users.
-- This data can be replaced with real packages later.

-- Goa Packages
insert into destination_packages (destination, title, description, nights, base_price, hotel_class, cab_type, inclusions, exclusions, highlights, tags, popularity_score, itinerary_json) values
(
  'Goa',
  'Goa Beach Bliss - 3N/4D',
  'Experience the best of Goa beaches with comfortable stays and hassle-free transfers.',
  3,
  12999,
  '3*',
  'sedan',
  array['3 Nights accommodation', 'Daily breakfast', 'Airport transfers', 'North Goa sightseeing', 'South Goa beach tour'],
  array['Airfare', 'Lunch and dinner', 'Water sports', 'Personal expenses'],
  array['Visit Calangute Beach', 'Explore Fort Aguada', 'Cruise on Mandovi River', 'Visit Basilica of Bom Jesus'],
  array['beach', 'romantic', 'weekend'],
  95,
  '[{"day": 1, "title": "Arrival & North Goa", "activities": ["Airport pickup", "Check-in at hotel", "North Goa beach tour", "Dinner at leisure"]}, {"day": 2, "title": "South Goa Exploration", "activities": ["Breakfast at hotel", "Visit Colva Beach", "Explore Old Goa churches", "Evening at Baga Beach"]}, {"day": 3, "title": "Leisure & Departure", "activities": ["Breakfast at hotel", "Free time for shopping", "Check-out", "Airport drop"]}]'::jsonb
),
(
  'Goa',
  'Luxury Goa Escape - 4N/5D',
  'Premium Goa experience with 5-star stays, private transfers and curated experiences.',
  4,
  34999,
  '5*',
  'suv',
  array['4 Nights at 5-star resort', 'All meals (MAP)', 'Private airport transfers', 'Sunset cruise with dinner', 'Spa session', 'Water sports package'],
  array['Airfare', 'Alcoholic beverages', 'Personal expenses'],
  array['Stay at beachfront resort', 'Private sunset cruise', 'Complimentary spa', 'Casino visit', 'Premium water sports'],
  array['beach', 'luxury', 'honeymoon', 'romantic'],
  90,
  '[{"day": 1, "title": "Arrival & Welcome", "activities": ["VIP airport pickup", "Welcome drink at resort", "Beach dinner"]}, {"day": 2, "title": "Water Sports Day", "activities": ["Breakfast", "Water sports: parasailing, jet ski", "Lunch at beach shack", "Spa session"]}, {"day": 3, "title": "Heritage & Cruise", "activities": ["Visit Old Goa", "Lunch at Fontainhas", "Sunset cruise with dinner"]}, {"day": 4, "title": "Leisure Day", "activities": ["Late breakfast", "Pool time", "Casino visit", "Farewell dinner"]}, {"day": 5, "title": "Departure", "activities": ["Breakfast", "Check-out", "Airport drop"]}]'::jsonb
);

-- Udaipur Packages
insert into destination_packages (destination, title, description, nights, base_price, hotel_class, cab_type, inclusions, exclusions, highlights, tags, popularity_score, itinerary_json) values
(
  'Udaipur',
  'Royal Udaipur - 3N/4D',
  'Experience the Venice of the East with heritage hotels and royal experiences.',
  3,
  15999,
  '4*',
  'sedan',
  array['3 Nights heritage hotel', 'Daily breakfast', 'Airport/Railway transfers', 'City Palace tour', 'Lake Pichola boat ride', 'Sajjangarh sunset visit'],
  array['Airfare/Train tickets', 'Lunch and dinner', 'Entry fees', 'Personal expenses'],
  array['City Palace Museum', 'Boat ride on Lake Pichola', 'Sunset at Monsoon Palace', 'Jagdish Temple', 'Local bazaar shopping'],
  array['heritage', 'romantic', 'culture'],
  92,
  '[{"day": 1, "title": "Arrival in Udaipur", "activities": ["Airport pickup", "Check-in at heritage hotel", "Evening at Gangaur Ghat", "Light show at City Palace"]}, {"day": 2, "title": "Royal Heritage Tour", "activities": ["Breakfast", "City Palace visit", "Jagdish Temple", "Lake Pichola boat ride", "Jag Mandir island"]}, {"day": 3, "title": "Culture & Sunset", "activities": ["Breakfast", "Saheliyon ki Bari", "Local bazaar shopping", "Sajjangarh Palace sunset"]}, {"day": 4, "title": "Departure", "activities": ["Breakfast", "Check-out", "Airport drop"]}]'::jsonb
),
(
  'Udaipur',
  'Udaipur Honeymoon Special - 4N/5D',
  'Romantic getaway in the city of lakes with luxury stays and couple experiences.',
  4,
  42999,
  'luxury',
  'suv',
  array['4 Nights at lake-view luxury hotel', 'All meals', 'Private transfers', 'Romantic boat dinner', 'Couple spa', 'Heritage walk', 'Cooking class'],
  array['Airfare', 'Alcoholic beverages', 'Personal expenses'],
  array['Lake-view suite stay', 'Private dinner on boat', 'Couple spa experience', 'Vintage car ride', 'Private palace tour'],
  array['honeymoon', 'romantic', 'luxury', 'couples'],
  88,
  '[{"day": 1, "title": "Romantic Welcome", "activities": ["Airport pickup in vintage car", "Lake-view suite check-in", "Welcome amenities", "Candle-lit dinner"]}, {"day": 2, "title": "Royal Experience", "activities": ["Breakfast in room", "Private City Palace tour", "Lunch at palace restaurant", "Couple spa"]}, {"day": 3, "title": "Lake Romance", "activities": ["Late breakfast", "Boat ride to Jag Mandir", "Cooking class", "Romantic dinner on boat"]}, {"day": 4, "title": "Heritage & Culture", "activities": ["Breakfast", "Heritage walk", "Shopping tour", "Sunset at Sajjangarh", "Farewell dinner"]}, {"day": 5, "title": "Departure", "activities": ["Breakfast", "Check-out", "Airport drop"]}]'::jsonb
);

-- Manali Packages
insert into destination_packages (destination, title, description, nights, base_price, hotel_class, cab_type, inclusions, exclusions, highlights, tags, popularity_score, itinerary_json) values
(
  'Manali',
  'Manali Adventure - 4N/5D',
  'Experience the thrill of mountains with adventure activities and scenic beauty.',
  4,
  16999,
  '3*',
  'suv',
  array['4 Nights accommodation', 'Daily breakfast', 'Volvo bus from Delhi (round trip)', 'Solang Valley tour', 'Rohtang Pass (subject to permit)', 'River rafting'],
  array['Lunch and dinner', 'Adventure activity charges', 'Personal expenses', 'Rohtang permit if not available'],
  array['Solang Valley adventures', 'Rohtang Pass excursion', 'River rafting in Beas', 'Old Manali exploration', 'Hadimba Temple'],
  array['adventure', 'mountains', 'nature', 'youth'],
  85,
  '[{"day": 1, "title": "Delhi to Manali", "activities": ["Board Volvo from Delhi", "Overnight journey"]}, {"day": 2, "title": "Arrival & Local", "activities": ["Morning arrival", "Hotel check-in", "Rest", "Evening Mall Road visit", "Hadimba Temple"]}, {"day": 3, "title": "Solang Valley", "activities": ["Breakfast", "Solang Valley excursion", "Adventure activities", "Return to hotel"]}, {"day": 4, "title": "Rohtang/Atal Tunnel", "activities": ["Early breakfast", "Rohtang Pass excursion", "Snow activities", "Return via Atal Tunnel"]}, {"day": 5, "title": "Departure", "activities": ["Breakfast", "Check-out", "River rafting", "Board return Volvo"]}]'::jsonb
),
(
  'Manali',
  'Manali Family Fun - 5N/6D',
  'Perfect family vacation in the mountains with comfortable stays and kid-friendly activities.',
  5,
  24999,
  '4*',
  'tempo',
  array['5 Nights at family resort', 'All meals', 'Private tempo traveller', 'All sightseeing', 'River rafting (for eligible)', 'Bonfire night'],
  array['Airfare/train', 'Personal expenses', 'Extra adventure activities'],
  array['Family resort with activities', 'Safe river rafting', 'Snow point visit', 'Bonfire and music night', 'Van Vihar nature walk'],
  array['family', 'mountains', 'kids', 'nature'],
  82,
  '[{"day": 1, "title": "Journey Begins", "activities": ["Board Volvo/Traveller from Delhi", "Overnight journey"]}, {"day": 2, "title": "Welcome to Manali", "activities": ["Morning arrival", "Resort check-in", "Kids play area", "Evening bonfire"]}, {"day": 3, "title": "Local Sightseeing", "activities": ["Breakfast", "Hadimba Temple", "Van Vihar", "Tibetan Monastery", "Mall Road"]}, {"day": 4, "title": "Solang Adventure", "activities": ["Breakfast", "Solang Valley", "Kid-friendly activities", "Picnic lunch"]}, {"day": 5, "title": "Kullu & Rafting", "activities": ["Breakfast", "Kullu sightseeing", "River rafting", "Shawl factory visit"]}, {"day": 6, "title": "Departure", "activities": ["Breakfast", "Check-out", "Return journey"]}]'::jsonb
);

-- Kerala Packages
insert into destination_packages (destination, title, description, nights, base_price, hotel_class, cab_type, inclusions, exclusions, highlights, tags, popularity_score, itinerary_json) values
(
  'Kerala',
  'Kerala Backwaters - 4N/5D',
  'Experience Gods Own Country with backwaters, beaches and hill stations.',
  4,
  19999,
  '4*',
  'sedan',
  array['1N Munnar', '1N Thekkady', '1N Alleppey Houseboat', '1N Kochi', 'All meals on houseboat', 'Daily breakfast', 'All transfers'],
  array['Airfare', 'Lunch and dinner (except houseboat)', 'Boating charges', 'Personal expenses'],
  array['Munnar tea gardens', 'Periyar wildlife', 'Alleppey houseboat cruise', 'Kathakali show', 'Fort Kochi heritage'],
  array['nature', 'backwaters', 'romantic', 'culture'],
  91,
  '[{"day": 1, "title": "Kochi to Munnar", "activities": ["Airport pickup", "Drive to Munnar", "Tea garden stop", "Check-in", "Evening leisure"]}, {"day": 2, "title": "Munnar Exploration", "activities": ["Breakfast", "Eravikulam National Park", "Tea Museum", "Drive to Thekkady"]}, {"day": 3, "title": "Thekkady & Backwaters", "activities": ["Breakfast", "Periyar boat ride", "Spice garden", "Drive to Alleppey", "Houseboat check-in"]}, {"day": 4, "title": "Backwaters & Kochi", "activities": ["Breakfast on houseboat", "Cruise through backwaters", "Disembark", "Drive to Kochi", "Kathakali show"]}, {"day": 5, "title": "Kochi & Departure", "activities": ["Breakfast", "Fort Kochi walk", "Chinese fishing nets", "Airport drop"]}]'::jsonb
),
(
  'Kerala',
  'Kerala Complete - 6N/7D',
  'The ultimate Kerala experience covering all highlights from hills to beaches.',
  6,
  32999,
  '4*',
  'suv',
  array['2N Munnar', '1N Thekkady', '1N Alleppey Houseboat', '2N Kovalam Beach', 'All breakfasts', 'All meals on houseboat', 'All transfers', 'Kathakali show'],
  array['Airfare', 'Lunch and dinner', 'Water sports', 'Personal expenses'],
  array['Munnar highlands', 'Wildlife at Periyar', 'Luxury houseboat', 'Kovalam beach', 'Ayurvedic massage'],
  array['nature', 'beach', 'backwaters', 'wellness', 'complete'],
  87,
  '[{"day": 1, "title": "Arrival in Kochi", "activities": ["Airport pickup", "Kochi sightseeing", "Drive to Munnar"]}, {"day": 2, "title": "Munnar Day 1", "activities": ["Tea gardens", "Mattupetty Dam", "Echo Point"]}, {"day": 3, "title": "Munnar to Thekkady", "activities": ["Eravikulam Park", "Drive to Thekkady", "Spice garden"]}, {"day": 4, "title": "Thekkady to Alleppey", "activities": ["Periyar boat ride", "Drive to Alleppey", "Houseboat cruise"]}, {"day": 5, "title": "Alleppey to Kovalam", "activities": ["Backwater cruise", "Drive to Kovalam", "Beach evening"]}, {"day": 6, "title": "Kovalam Beach", "activities": ["Beach day", "Ayurvedic spa", "Lighthouse visit"]}, {"day": 7, "title": "Departure", "activities": ["Breakfast", "Trivandrum sightseeing", "Airport drop"]}]'::jsonb
);

-- Jaipur Packages
insert into destination_packages (destination, title, description, nights, base_price, hotel_class, cab_type, inclusions, exclusions, highlights, tags, popularity_score, itinerary_json) values
(
  'Jaipur',
  'Pink City Heritage - 2N/3D',
  'Discover the royal heritage of Jaipur with forts, palaces and local culture.',
  2,
  9999,
  '3*',
  'sedan',
  array['2 Nights accommodation', 'Daily breakfast', 'All transfers', 'Full day city tour', 'Elephant ride at Amer'],
  array['Airfare/train', 'Lunch and dinner', 'Entry fees', 'Personal expenses'],
  array['Amer Fort elephant ride', 'City Palace tour', 'Hawa Mahal visit', 'Jantar Mantar', 'Local bazaar shopping'],
  array['heritage', 'culture', 'weekend', 'history'],
  89,
  '[{"day": 1, "title": "Arrival & Forts", "activities": ["Pickup from station/airport", "Amer Fort with elephant ride", "Jal Mahal photo stop", "Hotel check-in"]}, {"day": 2, "title": "Pink City Tour", "activities": ["Breakfast", "City Palace", "Jantar Mantar", "Hawa Mahal", "Local bazaar", "Albert Hall"]}, {"day": 3, "title": "Departure", "activities": ["Breakfast", "Birla Temple", "Check-out", "Drop to station/airport"]}]'::jsonb
);

-- Overlay 20: example seed data (DO NOT use as authoritative)
-- Replace with official county-level datasets (SOS exports, Election Project VEP, etc.)

-- Counties (CD2 starter set)
INSERT INTO counties (slug, name) VALUES
  ('pulaski', 'Pulaski'),
  ('faulkner', 'Faulkner'),
  ('saline', 'Saline'),
  ('conway', 'Conway'),
  ('perry', 'Perry'),
  ('white', 'White'),
  ('van-buren', 'Van Buren'),
  ('cleburne', 'Cleburne')
ON CONFLICT (slug) DO NOTHING;

-- County stats (VEP + registration)
-- NOTE: numbers below are placeholders.
INSERT INTO county_stats (county_id, year, vep, registered_voters, registered_percent)
SELECT id, 2022, 0, 0, NULL FROM counties
ON CONFLICT (county_id, year) DO NOTHING;

-- 2020 President (placeholder examples)
INSERT INTO election_results (county_id, election_year, election_type, office, party, candidate, votes, percent, source)
SELECT id, 2020, 'general', 'President', 'D', 'Joe Biden', NULL, NULL, 'seed.example'
FROM counties
ON CONFLICT DO NOTHING;

-- 2022 Governor (placeholders)
INSERT INTO election_results (county_id, election_year, election_type, office, party, candidate, votes, percent, source)
SELECT id, 2022, 'general', 'Governor', NULL, 'Chris Jones', NULL, NULL, 'seed.example'
FROM counties
ON CONFLICT DO NOTHING;

INSERT INTO election_results (county_id, election_year, election_type, office, party, candidate, votes, percent, source)
SELECT id, 2022, 'general', 'Governor', NULL, 'Sarah Huckabee Sanders', NULL, NULL, 'seed.example'
FROM counties
ON CONFLICT DO NOTHING;

-- 2022 Secretary of State (placeholders)
INSERT INTO election_results (county_id, election_year, election_type, office, party, candidate, votes, percent, source)
SELECT id, 2022, 'general', 'Secretary of State', NULL, 'SOS Candidate A', NULL, NULL, 'seed.example'
FROM counties
ON CONFLICT DO NOTHING;

-- 2026 President placeholder (no results yet)
INSERT INTO election_results (county_id, election_year, election_type, office, party, candidate, votes, percent, source)
SELECT id, 2026, 'general', 'President', NULL, 'TBD', NULL, NULL, 'placeholder'
FROM counties
ON CONFLICT DO NOTHING;

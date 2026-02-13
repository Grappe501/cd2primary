-- Overlay 21 seed: Faulkner County voting sites for March 3, 2026 election
-- Source: Vote Faulkner County website (captured text provided by campaign team)

-- 1) County
INSERT INTO counties (slug, name)
VALUES ('faulkner', 'Faulkner')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 2) Election
WITH c AS (
  SELECT id FROM counties WHERE slug = 'faulkner'
)
INSERT INTO elections (county_id, election_date, name, election_type, notes, source)
SELECT
  c.id,
  DATE '2026-03-03',
  'Preferential Primary, Nonpartisan General, School Board & Millage Rate, & Special Election for City of Greenbrier',
  'primary',
  'Faulkner County uses Vote Centers. Voters may vote at any Voting Site in the county. Election Day vote centers open 7:00 a.m.–7:30 p.m.; voters in line at 7:30 p.m. may vote.',
  'Vote Faulkner County'
FROM c
ON CONFLICT (county_id, election_date, election_type) DO UPDATE
  SET name = EXCLUDED.name,
      notes = EXCLUDED.notes,
      source = EXCLUDED.source,
      updated_at = now();

-- 3) Voting sites
WITH c AS (SELECT id AS county_id FROM counties WHERE slug = 'faulkner')
INSERT INTO voting_sites (county_id, name, address1, city, state, zip, notes, source)
SELECT c.county_id, v.name, v.address1, v.city, 'AR', NULL, NULL, 'Vote Faulkner County'
FROM c
JOIN (
  VALUES
    -- Early voting centers
    ('Faulkner County Courthouse', '801 Locust Ave', 'Conway'),
    ('Faulkner County Library', '1900 Tyler St', 'Conway'),
    ('Greenbrier Event Center', '5 Lois Ln', 'Greenbrier'),
    ('Mayflower Water Dept.', '2 Ashmore Dr', 'Mayflower'),
    ('McGee Sports Center', '3800 College Ave', 'Conway'),
    ('Vilonia First Baptist Church', '1206 Main St', 'Vilonia'),
    ('Conway Regional Medical Center', '2302 College Ave', 'Conway'),

    -- Election Day vote centers
    ('Conway Community Center', '250 Central Landing Blvd', 'Conway'),
    ('Copperas Springs Baptist Church', '366 Hwy 25N', 'Greenbrier'),
    ('Damascus Fire Dept.', '9 S Broadway (US Hwy 65)', 'Damascus'),
    ('Friendship Baptist Church', '767 Rocky Point Rd.', 'Conway'),
    ('Greenbrier Events Center', '5 Lois Ln', 'Greenbrier'),
    ('McGee Center', '3800 College Ave.', 'Conway'),
    ('Mt. Gale Baptist Church', '8 W. Brannon Dr.', 'Mayflower'),
    ('Mt. Vernon Baptist Church', '6 Garland Springs Rd.', 'Mt. Vernon'),
    ('Naylor United Methodist Church', '850 Hwy 36', 'Vilonia'),
    ('Pickles Gap Baptist Church', '2 Pickles Gap Rd.', 'Conway'),
    ('Springhill Baptist Church', '25 Hwy 287', 'Greenbrier'),
    ('Sulphur Springs Baptist Church', '1091 Hwy 107 N', 'Quitman'),
    ('True Holiness Church', '198 Hwy 286 E', 'Conway'),
    ('UCA Welcome Center', '250 Donaghey Ave', 'Conway'),
    ('University Church of Christ', '3155 Dave Ward Dr', 'Conway'),
    ('Wooster First Baptist Church', '68 Church Cir', 'Wooster')
) AS v(name, address1, city)
ON CONFLICT DO NOTHING;

-- 4) Voting site windows (explicit special-day blocks)
-- Times are stored with Central offset (-06:00) for clarity.

WITH
  c AS (SELECT id AS county_id FROM counties WHERE slug = 'faulkner'),
  e AS (
    SELECT id AS election_id
    FROM elections
    WHERE county_id = (SELECT county_id FROM c)
      AND election_date = DATE '2026-03-03'
      AND election_type = 'primary'
  )

-- Early voting: weekday block (Mon–Fri) Feb 17–Feb 27
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-02-17 08:00:00-06',
  TIMESTAMPTZ '2026-02-27 18:00:00-06',
  'Weekdays Feb 17–Feb 27 (Mon–Fri): 8:00 a.m. – 6:00 p.m.'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name IN (
    'Faulkner County Courthouse',
    'Faulkner County Library',
    'Greenbrier Event Center',
    'Mayflower Water Dept.',
    'McGee Sports Center',
    'Vilonia First Baptist Church'
  )
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


-- Early voting: Mon Mar 2 special hours
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-03-02 08:00:00-06',
  TIMESTAMPTZ '2026-03-02 17:00:00-06',
  'Monday March 2, 2026: 8:00 a.m. – 5:00 p.m.'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name IN (
    'Faulkner County Courthouse',
    'Faulkner County Library',
    'Greenbrier Event Center',
    'Mayflower Water Dept.',
    'McGee Sports Center',
    'Vilonia First Baptist Church'
  )
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


-- Early voting: Sat Feb 21 Courthouse only
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-02-21 08:00:00-06',
  TIMESTAMPTZ '2026-02-21 18:00:00-06',
  'Saturday Feb 21, 2026: 8:00 a.m. – 6:00 p.m. (Courthouse only)'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name = 'Faulkner County Courthouse'
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


-- Early voting: Sat Feb 28 Courthouse only
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-02-28 08:00:00-06',
  TIMESTAMPTZ '2026-02-28 18:00:00-06',
  'Saturday Feb 28, 2026: 8:00 a.m. – 6:00 p.m. (Courthouse only)'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name = 'Faulkner County Courthouse'
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


-- Early voting: Wed/Thu special center (Conway Regional)
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-02-25 08:00:00-06',
  TIMESTAMPTZ '2026-02-25 18:00:00-06',
  'Wednesday Feb 25, 2026: 8:00 a.m. – 6:00 p.m. (Conway Regional only)'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name = 'Conway Regional Medical Center'
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'early',
  TIMESTAMPTZ '2026-02-26 08:00:00-06',
  TIMESTAMPTZ '2026-02-26 18:00:00-06',
  'Thursday Feb 26, 2026: 8:00 a.m. – 6:00 p.m. (Conway Regional only)'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name = 'Conway Regional Medical Center'
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;


-- Election Day: all vote centers (including the library and other shared sites)
INSERT INTO voting_site_windows (voting_site_id, election_id, kind, start_ts, end_ts, notes)
SELECT vs.id, (SELECT election_id FROM e), 'election_day',
  TIMESTAMPTZ '2026-03-03 07:00:00-06',
  TIMESTAMPTZ '2026-03-03 19:30:00-06',
  'Election Day March 3, 2026: 7:30 a.m. – 7:30 p.m. (Vote centers open 7:00 a.m.
ON CONFLICT (voting_site_id, election_id, kind, start_ts, end_ts)
DO NOTHING;
 line at 7:30 p.m. votes)'
FROM voting_sites vs
WHERE vs.county_id = (SELECT county_id FROM c)
  AND vs.name IN (
    'Conway Community Center',
    'Copperas Springs Baptist Church',
    'Damascus Fire Dept.',
    'Faulkner County Library',
    'Friendship Baptist Church',
    'Greenbrier Events Center',
    'Mayflower Water Dept.',
    'McGee Center',
    'Mt. Gale Baptist Church',
    'Mt. Vernon Baptist Church',
    'Naylor United Methodist Church',
    'Pickles Gap Baptist Church',
    'Springhill Baptist Church',
    'Sulphur Springs Baptist Church',
    'True Holiness Church',
    'UCA Welcome Center',
    'University Church of Christ',
    'Vilonia First Baptist Church',
    'Wooster First Baptist Church'
  );

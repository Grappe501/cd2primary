-- Overlay 20: County Intel DB (VEP) + Elections + Locations
-- Canonical schema for county-level voter intel + polling locations.

-- Counties
CREATE TABLE IF NOT EXISTS counties (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- County stats by year (VEP-centered)
CREATE TABLE IF NOT EXISTS county_stats (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  vep INTEGER, -- Voting Eligible Population
  registered_voters INTEGER,
  registered_percent NUMERIC(6,3),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(county_id, year)
);

-- County election results (by office and candidate)
CREATE TABLE IF NOT EXISTS election_results (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  election_year INTEGER NOT NULL,
  election_type TEXT NOT NULL, -- e.g. 'general'
  office TEXT NOT NULL, -- e.g. 'President', 'Governor', 'Secretary of State'
  party TEXT,
  candidate TEXT NOT NULL,
  votes INTEGER,
  percent NUMERIC(6,3),
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS election_results_county_year_idx
  ON election_results(county_id, election_year);

-- Polling locations (for mapping/drill-down)
CREATE TABLE IF NOT EXISTS polling_locations (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address1 TEXT,
  city TEXT,
  state TEXT DEFAULT 'AR',
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  kind TEXT DEFAULT 'election_day', -- 'election_day' | 'early_voting'
  hours TEXT,
  notes TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS polling_locations_county_idx
  ON polling_locations(county_id);

-- Precincts mapped to polling locations
CREATE TABLE IF NOT EXISTS precincts (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  precinct_code TEXT NOT NULL,
  polling_location_id INTEGER REFERENCES polling_locations(id) ON DELETE SET NULL,
  is_new_location BOOLEAN DEFAULT false,
  source TEXT,
  UNIQUE(county_id, precinct_code)
);

CREATE INDEX IF NOT EXISTS precincts_location_idx
  ON precincts(polling_location_id);

-- Elections (county-scoped)
CREATE TABLE IF NOT EXISTS elections (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  election_date DATE NOT NULL,
  name TEXT NOT NULL,
  election_type TEXT NOT NULL, -- e.g. 'primary', 'general'
  notes TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(county_id, election_date, election_type)
);

CREATE INDEX IF NOT EXISTS elections_county_date_idx
  ON elections(county_id, election_date);

-- Voting sites (used for both early voting and election day vote centers)
CREATE TABLE IF NOT EXISTS voting_sites (
  id SERIAL PRIMARY KEY,
  county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address1 TEXT,
  city TEXT,
  state TEXT DEFAULT 'AR',
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  notes TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voting_sites_county_idx
  ON voting_sites(county_id);

-- Date/time windows for a voting site during a specific election.
-- Allows special-day hours (e.g. two Saturdays, two special weekdays).
CREATE TABLE IF NOT EXISTS voting_site_windows (
  id SERIAL PRIMARY KEY,
  voting_site_id INTEGER NOT NULL REFERENCES voting_sites(id) ON DELETE CASCADE,
  election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'early' | 'election_day'
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voting_site_windows_election_kind_idx
  ON voting_site_windows(election_id, kind);

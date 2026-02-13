-- PostGIS schema for SIGEM-AO (simplified)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen',
  location geometry(POINT,4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE type_disaster (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  severity INTEGER DEFAULT 1
);

CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type_disaster_id INTEGER REFERENCES type_disaster(id),
  user_id INTEGER REFERENCES users(id),
  location geometry(POINT,4326),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  polygon geometry(POLYGON,4326),
  risk_level INTEGER DEFAULT 1
);

CREATE TABLE volunteers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  specialty TEXT,
  status TEXT DEFAULT 'active'
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES incidents(id),
  impact TEXT,
  estimated_damage NUMERIC,
  affected_count INTEGER,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  region_id INTEGER REFERENCES regions(id),
  message TEXT,
  level INTEGER DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_regions_polygon ON regions USING GIST(polygon);

-- Pramaan schema. Run once in the Supabase SQL Editor (requires Postgres 14+ for bit_count).

create extension if not exists postgis;
create extension if not exists vector;

create table if not exists org (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text check (kind in ('ngo','govt','csr','other')) default 'ngo',
  created_at timestamptz default now()
);

create table if not exists project (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references org(id) on delete cascade,
  code text not null,
  name text not null,
  summary text,
  funder text,
  start_date date,
  end_date date,
  sdgs text[],
  unique (org_id, code)
);

create table if not exists site (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  code text not null,
  name text not null,
  village text,
  district text,
  state text,
  setting text,
  geofence geography(Polygon, 4326),
  center geography(Point, 4326),
  radius_m int default 100,
  unique (project_id, code)
);
create index if not exists site_geofence_idx on site using gist (geofence);

create table if not exists evidence (
  id text primary key, -- ev_<id>
  org_id uuid not null references org(id) on delete cascade,
  project_id uuid references project(id) on delete set null,
  site_id uuid references site(id) on delete set null,
  cld_asset_id text unique not null,
  cld_public_id text not null,
  cld_version bigint not null,
  resource_type text check (resource_type in ('image','video','raw')) not null,
  format text not null,
  bytes bigint not null,
  width int,
  height int,
  duration_s numeric,
  etag text not null,
  source_channel text default 'field_app',
  client_sha256 text not null,
  app_capture_time timestamptz,
  exif_time timestamptz,
  device text,
  software text,
  gps geography(Point, 4326),
  gps_accuracy_m numeric,
  geo_status text check (geo_status in ('in_geofence','outside_geofence','no_gps','inferred')),
  phase text check (phase in ('before','during','after','monitoring')) not null,
  activity_claimed text not null,
  phash bigint, -- 64-bit pHash stored as signed bigint
  trust_score int default 0,
  trust_status text check (trust_status in ('pending','verified','needs_review','flagged','rejected')) default 'pending',
  consent_status text check (consent_status in ('not_required','obtained','pending','denied','withdrawn')) default 'not_required',
  people_flags text[] default '{}',
  created_at timestamptz default now()
);
create index if not exists evidence_gps_idx on evidence using gist (gps);
create index if not exists evidence_phash_idx on evidence (phash);
create index if not exists evidence_lookup_idx on evidence (org_id, project_id, site_id, phase);

create table if not exists understanding (
  evidence_id text primary key references evidence(id) on delete cascade,
  ai_vision jsonb not null,
  caption text,
  activity_detected text,
  activity_matches_claim text,
  embedding vector(1024)
);

create table if not exists review (
  id bigserial primary key,
  evidence_id text references evidence(id) on delete cascade,
  decision text check (decision in ('verified','rejected','recapture_requested')) not null,
  reason text not null,
  created_at timestamptz default now()
);

create table if not exists pair (
  id text primary key,
  site_id uuid references site(id) on delete cascade,
  before_id text references evidence(id) on delete cascade,
  after_id text references evidence(id) on delete cascade,
  candidate_score numeric not null,
  status text check (status in ('suggested','approved','rejected')) default 'suggested',
  ai_comparison jsonb,
  exg_before numeric,
  exg_after numeric,
  composite_url text,
  created_at timestamptz default now()
);

create table if not exists story (
  id text primary key,
  org_id uuid references org(id) on delete cascade,
  template text not null,
  period text not null,
  report jsonb not null,
  citation_coverage numeric not null,
  status text check (status in ('draft','published','withdrawn')) default 'draft',
  published_at timestamptz
);

create table if not exists derivative (
  id text primary key, -- dv_<shortId> for QR URLs
  base_evidence_id text references evidence(id) on delete cascade,
  base_asset_id text not null,
  base_version bigint not null,
  story_id text references story(id) on delete set null,
  kind text not null,
  transformation text not null,
  delivery_url text not null,
  class text check (class in ('transcoded','redacted','edited','ai_generated')) not null,
  created_at timestamptz default now()
);

create table if not exists ledger_entry (
  seq bigserial primary key,
  org_id uuid references org(id) on delete cascade,
  subject_type text not null,
  subject_id text not null,
  event text not null,
  payload jsonb not null,
  payload_hash text not null,
  prev_hash text not null,
  entry_hash text not null,
  actor text not null,
  created_at timestamptz default now()
);
create index if not exists ledger_subject_idx on ledger_entry (subject_type, subject_id);

-- 64-bit pHash Hamming distance search. target_phash is a signed-bigint string.
create or replace function match_phash_candidates(target_phash text, max_distance int)
returns table (id text, distance int, project_id uuid, cld_public_id text)
language sql stable as $$
  select
    e.id,
    bit_count((e.phash # target_phash::bigint)::bit(64))::int as distance,
    e.project_id,
    e.cld_public_id
  from evidence e
  where e.phash is not null
    and bit_count((e.phash # target_phash::bigint)::bit(64)) <= max_distance
  order by 2 asc
  limit 10;
$$;

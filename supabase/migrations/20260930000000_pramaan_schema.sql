-- Pramaan baseline schema.
-- Applies cleanly to a fresh Supabase project (`supabase db reset` locally, `supabase db push` remotely).
-- Requires Postgres 14+ (bit_count). Contains no demo data: see scripts/seed.ts.
--
-- Extensions: only PostGIS is required (site geofences, evidence GPS, check_site_geofence()).
-- pgvector is intentionally absent: nothing in the application reads or writes an embedding yet.
-- UUIDs use gen_random_uuid(), which is built into Postgres core, so pgcrypto is not needed.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Hierarchy: org -> project -> site -> evidence -> claims / stories / derivatives
-- ---------------------------------------------------------------------------

create table if not exists org (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null default 'ngo' check (kind in ('ngo','govt','csr','other')),
  created_at timestamptz not null default now()
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
  unique (org_id, code),
  check (end_date is null or start_date is null or end_date >= start_date)
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
  radius_m int default 100 check (radius_m is null or radius_m > 0),
  unique (project_id, code),
  check (geofence is null or st_isvalid(geofence::geometry))
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
  resource_type text not null check (resource_type in ('image','video','raw')),
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
  phase text not null check (phase in ('before','during','after','monitoring')),
  activity_claimed text not null,
  phash bigint, -- 64-bit pHash stored as signed bigint
  trust_score int not null default 0 check (trust_score between 0 and 100),
  trust_status text not null default 'pending'
    check (trust_status in ('pending','verified','needs_review','flagged','rejected')),
  consent_status text not null default 'not_required'
    check (consent_status in ('not_required','obtained','pending','denied','withdrawn')),
  people_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists evidence_gps_idx on evidence using gist (gps);
create index if not exists evidence_phash_idx on evidence (phash);
create index if not exists evidence_lookup_idx on evidence (org_id, project_id, site_id, phase);
create index if not exists evidence_site_timeline_idx on evidence (site_id, created_at);
-- Review queue: flagged / needs_review, lowest score first.
create index if not exists evidence_review_queue_idx on evidence (trust_score, created_at)
  where trust_status in ('flagged','needs_review');
-- Story synthesis reads verified evidence only.
create index if not exists evidence_verified_idx on evidence (org_id, created_at)
  where trust_status = 'verified';

create table if not exists understanding (
  evidence_id text primary key references evidence(id) on delete cascade,
  ai_vision jsonb not null,
  caption text,
  activity_detected text,
  activity_matches_claim text
);

create table if not exists review (
  id bigserial primary key,
  evidence_id text not null references evidence(id) on delete cascade,
  decision text not null check (decision in ('verified','rejected','recapture_requested')),
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists review_evidence_idx on review (evidence_id, created_at);

create table if not exists pair (
  id text primary key,
  site_id uuid not null references site(id) on delete cascade,
  before_id text not null references evidence(id) on delete cascade,
  after_id text not null references evidence(id) on delete cascade,
  candidate_score numeric not null,
  status text not null default 'suggested' check (status in ('suggested','approved','rejected')),
  ai_comparison jsonb,
  exg_before numeric,
  exg_after numeric,
  composite_url text,
  created_at timestamptz not null default now(),
  check (before_id <> after_id)
);
create index if not exists pair_site_idx on pair (site_id);
create index if not exists pair_before_idx on pair (before_id);
create index if not exists pair_after_idx on pair (after_id);

create table if not exists story (
  id text primary key,
  org_id uuid not null references org(id) on delete cascade,
  template text not null,
  period text not null,
  report jsonb not null,
  citation_coverage numeric not null check (citation_coverage between 0 and 1),
  status text not null default 'draft' check (status in ('draft','published','withdrawn')),
  published_at timestamptz
);
create index if not exists story_org_idx on story (org_id);

create table if not exists derivative (
  id text primary key, -- dv_<shortId> for QR URLs
  base_evidence_id text not null references evidence(id) on delete cascade,
  base_asset_id text not null,
  base_version bigint not null,
  story_id text references story(id) on delete set null,
  kind text not null,
  transformation text not null,
  delivery_url text not null,
  class text not null check (class in ('transcoded','redacted','edited','ai_generated')),
  created_at timestamptz not null default now()
);
create index if not exists derivative_evidence_idx on derivative (base_evidence_id);
create index if not exists derivative_story_idx on derivative (story_id);

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
  created_at timestamptz not null default now()
);
create index if not exists ledger_subject_idx on ledger_entry (subject_type, subject_id);
create index if not exists ledger_org_idx on ledger_entry (org_id, seq);

-- Impact claims: what the programme says it achieved, and the evidence offered for it.
create table if not exists claim (
  id text primary key, -- cl_<id>
  project_id uuid not null references project(id) on delete cascade,
  site_id uuid not null references site(id) on delete cascade,
  statement text not null,
  activity text not null,
  expected_evidence int not null default 5 check (expected_evidence > 0), -- verified assets needed for full coverage
  created_at timestamptz not null default now()
);
create index if not exists claim_project_idx on claim (project_id);
create index if not exists claim_site_idx on claim (site_id);

create table if not exists claim_evidence (
  claim_id text not null references claim(id) on delete cascade,
  evidence_id text not null references evidence(id) on delete cascade,
  primary key (claim_id, evidence_id)
);
create index if not exists claim_evidence_evidence_idx on claim_evidence (evidence_id);

-- Evidence may only support a claim from its own organisation and site, so one tenant's
-- evidence can never be attached to (or counted toward) another tenant's claim.
create or replace function enforce_claim_evidence_scope()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1
    from claim c
    join project p on p.id = c.project_id
    join evidence e on e.id = new.evidence_id
    where c.id = new.claim_id
      and e.org_id = p.org_id
      and e.site_id = c.site_id
  ) then
    raise exception 'evidence % does not belong to the org and site of claim %', new.evidence_id, new.claim_id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists claim_evidence_scope on claim_evidence;
create trigger claim_evidence_scope
  before insert or update on claim_evidence
  for each row execute function enforce_claim_evidence_scope();

-- ---------------------------------------------------------------------------
-- Functions (both are called by lib/trust-engine.ts)
-- ---------------------------------------------------------------------------

-- 64-bit pHash Hamming distance search. target_phash is a signed-bigint string.
-- Scans evidence with a phash: fine at hackathon scale; a BK-tree / bit-sliced index would be
-- needed beyond ~1M rows.
create or replace function match_phash_candidates(target_phash text, max_distance int)
returns table (id text, distance int, project_id uuid, cld_public_id text)
language sql stable
set search_path = public, extensions
as $$
  select
    e.id,
    bit_count((e.phash # target_phash::bigint)::bit(64))::int as distance,
    e.project_id,
    e.cld_public_id
  from evidence e
  where e.phash is not null
    and bit_count((e.phash # target_phash::bigint)::bit(64)) <= max_distance
  order by 2 asc, e.id asc
  limit 10;
$$;

-- Site geofence check. Uses the site polygon when present, otherwise center + radius_m.
-- inside: point is within the geofence. distance_m: metres outside it (0 when inside).
-- Returns no row when the site has neither a polygon nor a center point.
create or replace function check_site_geofence(p_site_id uuid, p_lng double precision, p_lat double precision)
returns table (inside boolean, distance_m double precision, method text)
language sql stable
set search_path = public, extensions
as $$
  select
    case when s.geofence is not null
      then st_covers(s.geofence, pt.g)
      else st_dwithin(s.center, pt.g, coalesce(s.radius_m, 100))
    end as inside,
    case when s.geofence is not null
      then st_distance(s.geofence, pt.g)
      else greatest(0, st_distance(s.center, pt.g) - coalesce(s.radius_m, 100))
    end as distance_m,
    case when s.geofence is not null then 'polygon' else 'radius' end as method
  from site s
  cross join lateral (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g
  ) pt
  where s.id = p_site_id
    and (s.geofence is not null or s.center is not null);
$$;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
-- The app has no user authentication yet: every server route talks to Postgres with the
-- service-role key (lib/db.ts), which bypasses RLS. Tenant isolation is therefore NOT enforced
-- per user today. What this migration does guarantee:
--   * RLS is enabled on every table and no policy grants anon / authenticated access, so the
--     public anon key (shipped to browsers) can read and write nothing.
--   * The SQL functions are callable by service_role only.
-- When Supabase Auth is added, add per-org policies keyed on a membership table
-- (org_id in (select org_id from org_member where user_id = auth.uid())) and flip lib/db.ts to a
-- per-request user client. Until then, do not expose the service-role key or these routes publicly.

alter table org enable row level security;
alter table project enable row level security;
alter table site enable row level security;
alter table evidence enable row level security;
alter table understanding enable row level security;
alter table review enable row level security;
alter table pair enable row level security;
alter table story enable row level security;
alter table derivative enable row level security;
alter table ledger_entry enable row level security;
alter table claim enable row level security;
alter table claim_evidence enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

revoke execute on function match_phash_candidates(text, int) from public, anon, authenticated;
revoke execute on function check_site_geofence(uuid, double precision, double precision) from public, anon, authenticated;
revoke execute on function enforce_claim_evidence_scope() from public, anon, authenticated;
grant execute on function match_phash_candidates(text, int) to service_role;
grant execute on function check_site_geofence(uuid, double precision, double precision) to service_role;

create extension if not exists pgcrypto;

create table if not exists public.creative_briefs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  title varchar(90) not null,
  project_description varchar(2000) not null,
  target_audience varchar(500) not null,
  creative_style varchar(32) not null
    check (creative_style in ('Modern', 'Realistic', 'Cinematic', 'Minimalist', 'Professional', 'Artistic', 'Other')),
  output_format varchar(40) not null
    check (output_format in ('Image', 'Video', 'Website Design', 'Social Media Content', 'Advertisement', 'Other')),
  content_type varchar(64) not null,
  aspect_ratio varchar(32) not null,
  commercial_use varchar(32) not null
    check (commercial_use in ('Personal Use', 'Commercial Use', 'Educational Use', 'Other')),
  duration varchar(40) not null,
  budget numeric(12, 2) check (budget is null or budget between 0 and 100000000),
  deadline date,
  additional_requirements varchar(2000) not null default '',
  details text not null default '',
  reference_files jsonb not null default '[]'::jsonb
    check (jsonb_typeof(reference_files) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists creative_briefs_brand_created_idx
  on public.creative_briefs (brand_id, created_at desc);

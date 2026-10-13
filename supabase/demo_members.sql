-- Demo-only dataset: 800 fictional creators + 200 fictional brands.
-- All email addresses use example.test, a reserved domain for examples.
create table if not exists public.demo_members (
  id uuid primary key,
  role text not null check (role in ('Creator', 'Brand')),
  name text not null,
  email text not null unique,
  company_name text,
  location text not null,
  specialty text not null,
  bio text not null,
  skills text[] not null default '{}',
  tools_models text[] not null default '{}',
  content_types text[] not null default '{}',
  formats text[] not null default '{}',
  commercial_use text[] not null default '{}',
  portfolio_count integer not null default 0 check (portfolio_count >= 0),
  hourly_rate_usd integer check (hourly_rate_usd >= 0),
  verified_tools boolean not null default false,
  verified_workflow boolean not null default false,
  verified_past_work boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists demo_members_role_idx on public.demo_members (role);
create index if not exists demo_members_specialty_idx on public.demo_members (specialty);
create index if not exists demo_members_skills_idx on public.demo_members using gin (skills);
create index if not exists demo_members_tools_idx on public.demo_members using gin (tools_models);

alter table public.demo_members enable row level security;
drop policy if exists "Demo members are readable by everyone" on public.demo_members;
create policy "Demo members are readable by everyone"
  on public.demo_members
  for select
  to anon, authenticated
  using (true);
grant select on public.demo_members to anon, authenticated;

with seed as (
  select member_number
  from generate_series(1, 1000) as members(member_number)
),
catalog as (
  select
    array['Avery', 'Jordan', 'Morgan', 'Riley', 'Quinn', 'Sage', 'Kai', 'Noah', 'Maya', 'Amara', 'Leo', 'Jules', 'Remy', 'Nia', 'Elliot', 'Zara', 'Rowan', 'Ivy', 'Theo', 'Sam']::text[] as first_names,
    array['Chen', 'Okafor', 'Williams', 'Park', 'Rivera', 'Patel', 'Kim', 'Nguyen', 'Johnson', 'Singh', 'Garcia', 'Brown', 'Wilson', 'Martin', 'Davis', 'Ali', 'Clarke', 'Lopez', 'Taylor', 'Bennett']::text[] as surnames,
    array['Brooklyn, NY', 'London, UK', 'Los Angeles, CA', 'Seoul, South Korea', 'Toronto, Canada', 'Berlin, Germany', 'Mumbai, India', 'Tokyo, Japan', 'Amsterdam, Netherlands', 'Sydney, Australia', 'Mexico City, Mexico', 'Nairobi, Kenya']::text[] as locations,
    array['AI Filmmaker', 'AI Animator', 'Generative 3D Artist', 'AI Art Director', 'Motion Designer', 'AI Image Maker', 'Creative Technologist', 'Visual Storyteller']::text[] as specialties,
    array['Runway', 'Midjourney', 'Blender', 'ComfyUI', 'Pika', 'Adobe Firefly', 'Stable Diffusion', 'Sora', 'Kling', 'DaVinci Resolve', 'After Effects', 'Luma']::text[] as tools,
    array['AI filmmaking', 'AI animation', 'Art direction', '3D animation', 'Motion design', 'Product visualization', 'AI image generation', 'ComfyUI workflows', 'Brand campaigns', 'Video editing', 'Character design', 'Creative technology']::text[] as skills,
    array['16:9', '9:16', '1:1', '4:5', 'Multiple formats']::text[] as formats,
    array['Northstar Studio', 'Goodform Creative', 'Soft Focus Agency', 'Fieldwork Collective', 'New Rituals Co.', 'Brightside Brands', 'Daydream Works', 'Open Frame Studio', 'Future Folk', 'Common Thread Agency']::text[] as company_names
)
insert into public.demo_members (
  id, role, name, email, company_name, location, specialty, bio,
  skills, tools_models, content_types, formats, commercial_use,
  portfolio_count, hourly_rate_usd, verified_tools, verified_workflow, verified_past_work
)
select
  md5('creatorbridge-demo-member-' || lpad(seed.member_number::text, 4, '0'))::uuid,
  case when seed.member_number <= 800 then 'Creator' else 'Brand' end,
  case
    when seed.member_number <= 800 then
      catalog.first_names[((seed.member_number - 1) % cardinality(catalog.first_names)) + 1]
      || ' ' ||
      catalog.surnames[((seed.member_number * 7 - 1) % cardinality(catalog.surnames)) + 1]
    else
      catalog.company_names[((seed.member_number - 801) % cardinality(catalog.company_names)) + 1]
      || ' ' ||
      lpad((seed.member_number - 800)::text, 3, '0')
  end,
  case when seed.member_number <= 800 then
    'creator.' || lpad(seed.member_number::text, 4, '0') || '@example.test'
  else
    'brand.' || lpad((seed.member_number - 800)::text, 4, '0') || '@example.test'
  end,
  case when seed.member_number > 800 then
    catalog.company_names[((seed.member_number - 801) % cardinality(catalog.company_names)) + 1]
      || ' ' ||
    lpad((seed.member_number - 800)::text, 3, '0')
  else null end,
  catalog.locations[((seed.member_number * 3 - 1) % cardinality(catalog.locations)) + 1],
  case when seed.member_number <= 800
    then catalog.specialties[((seed.member_number * 5 - 1) % cardinality(catalog.specialties)) + 1]
    else 'Brand / Agency'
  end,
  case when seed.member_number <= 800
    then 'Independent creative building thoughtful, original work with AI-native tools. Shares process, model choices, and human finishing details with every collaboration.'
    else 'A fictional demo brand looking for distinctive, production-ready creative partners for upcoming campaigns and content.'
  end,
  case when seed.member_number <= 800 then array[
    catalog.skills[((seed.member_number - 1) % cardinality(catalog.skills)) + 1],
    catalog.skills[((seed.member_number + 3) % cardinality(catalog.skills)) + 1]
  ] else '{}'::text[] end,
  case when seed.member_number <= 800 then array[
    catalog.tools[((seed.member_number - 1) % cardinality(catalog.tools)) + 1],
    catalog.tools[((seed.member_number + 4) % cardinality(catalog.tools)) + 1],
    catalog.tools[((seed.member_number + 8) % cardinality(catalog.tools)) + 1]
  ] else '{}'::text[] end,
  case when seed.member_number <= 800 then array[
    case (seed.member_number % 4)
      when 0 then 'Film & video'
      when 1 then 'Animation'
      when 2 then 'Images & campaigns'
      else '3D & immersive'
    end
  ] else array['Campaigns', 'Social content'] end,
  case when seed.member_number <= 800 then array[
    catalog.formats[((seed.member_number - 1) % cardinality(catalog.formats)) + 1],
    catalog.formats[((seed.member_number + 2) % cardinality(catalog.formats)) + 1]
  ] else '{}'::text[] end,
  case when seed.member_number <= 800 then array['Paid social', 'Organic social', 'Web and digital']
    else array['Paid and organic social', 'Web and digital'] end,
  case when seed.member_number <= 800 then (seed.member_number % 36) + 1 else 0 end,
  case when seed.member_number <= 800 then 35 + (seed.member_number % 166) else null end,
  seed.member_number % 3 = 0,
  seed.member_number % 4 = 0,
  seed.member_number % 5 = 0
from seed
cross join catalog
on conflict (id) do update set
  role = excluded.role,
  name = excluded.name,
  email = excluded.email,
  company_name = excluded.company_name,
  location = excluded.location,
  specialty = excluded.specialty,
  bio = excluded.bio,
  skills = excluded.skills,
  tools_models = excluded.tools_models,
  content_types = excluded.content_types,
  formats = excluded.formats,
  commercial_use = excluded.commercial_use,
  portfolio_count = excluded.portfolio_count,
  hourly_rate_usd = excluded.hourly_rate_usd,
  verified_tools = excluded.verified_tools,
  verified_workflow = excluded.verified_workflow,
  verified_past_work = excluded.verified_past_work;

-- Verify the expected total and role split after the seed.
select role, count(*) as member_count
from public.demo_members
group by role
order by role;

-- Creates 1,000 fictional, searchable creator profiles for demos.
-- All contact details are synthetic and use reserved example.test emails.
create table if not exists public.demo_creator_profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  phone text not null,
  category text not null,
  location text not null,
  minimum_budget_inr integer not null check (minimum_budget_inr >= 0),
  maximum_budget_inr integer not null check (maximum_budget_inr >= minimum_budget_inr),
  skills text[] not null default '{}',
  experience_level text not null,
  ai_tools text[] not null default '{}',
  portfolio_description text not null,
  profile_picture_url text not null,
  reference_images text[] not null default '{}',
  reference_videos text[] not null default '{}',
  previous_projects jsonb not null default '[]'::jsonb,
  availability text not null,
  bio text not null,
  completed_projects integer not null default 0 check (completed_projects >= 0),
  completion_rate numeric(5, 2) not null default 0 check (completion_rate between 0 and 100),
  verification_status text not null default 'Unverified',
  formats text[] not null default '{}',
  commercial_use text[] not null default '{}',
  workflow text not null,
  created_at timestamptz not null default now()
);

create index if not exists demo_creator_profiles_category_idx
  on public.demo_creator_profiles (category);
create index if not exists demo_creator_profiles_location_idx
  on public.demo_creator_profiles (location);
create index if not exists demo_creator_profiles_budget_idx
  on public.demo_creator_profiles (minimum_budget_inr, maximum_budget_inr);
create index if not exists demo_creator_profiles_skills_idx
  on public.demo_creator_profiles using gin (skills);
create index if not exists demo_creator_profiles_tools_idx
  on public.demo_creator_profiles using gin (ai_tools);

alter table public.demo_creator_profiles enable row level security;
drop policy if exists "Demo creator profiles are publicly readable"
  on public.demo_creator_profiles;
create policy "Demo creator profiles are publicly readable"
  on public.demo_creator_profiles
  for select
  to anon, authenticated
  using (true);
grant select on public.demo_creator_profiles to anon, authenticated;

with catalogs as (
  select
    array['Aarav', 'Aanya', 'Aditya', 'Aisha', 'Anaya', 'Arjun', 'Dev', 'Diya', 'Ishaan', 'Kabir', 'Kavya', 'Kiara', 'Mira', 'Neel', 'Nisha', 'Rohan', 'Sana', 'Tara', 'Vihaan', 'Zoya', 'Amara', 'Elliot', 'Jules', 'Maya', 'Noah']::text[] as first_names,
    array['Sharma', 'Patel', 'Rao', 'Mehta', 'Nair', 'Kapoor', 'Iyer', 'Khan', 'Das', 'Joshi', 'Reddy', 'Singh', 'Chen', 'Okafor', 'Park', 'Rivera', 'Kim', 'Nguyen', 'Williams', 'Taylor', 'Morgan', 'Clarke', 'Bennett', 'Ali', 'Martin', 'Lopez', 'Brown', 'Wilson', 'Davis', 'Garcia', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Lewis', 'Robinson', 'Walker', 'Young', 'King']::text[] as surnames,
    array['Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Hyderabad, India', 'Pune, India', 'Chennai, India', 'Kolkata, India', 'Ahmedabad, India', 'Jaipur, India', 'Kochi, India', 'London, UK', 'Brooklyn, NY', 'Los Angeles, CA', 'Toronto, Canada', 'Berlin, Germany', 'Nairobi, Kenya']::text[] as locations,
    array['AI Filmmaking', 'AI Animation', 'AI Video Editing', 'Graphic Design', 'Generative AI', 'AI Advertising', 'Content Creation', 'Motion Graphics', 'Social Media Marketing', 'AI Image Generation']::text[] as categories,
    array['Runway', 'Midjourney', 'Blender', 'ComfyUI', 'Pika', 'Adobe Firefly', 'Stable Diffusion', 'DaVinci Resolve', 'After Effects', 'Kling', 'Luma', 'Sora']::text[] as tools,
    array['AI filmmaking', 'AI animation', 'video editing', 'art direction', '3D animation', 'product visualization', 'ComfyUI workflows', 'brand campaigns', 'motion graphics', 'AI image generation', 'social storytelling', 'character design', 'prompt design', 'compositing', 'visual development']::text[] as skill_catalog,
    array['16:9', '9:16', '1:1', '4:5']::text[] as format_catalog,
    array['Cinematic brand film', 'Character-led social story', 'Generative product visuals', 'Campaign visual system', 'Motion identity and launch kit', 'Editorial world-building', 'Short-form product animation', 'Interactive visual concept']::text[] as project_titles,
    array['Runway image-to-video and DaVinci Resolve finishing', 'Midjourney style-frame exploration with human art direction', 'Blender scene design with ComfyUI material studies', 'Pika animation with hand-cleaned After Effects compositing', 'Stable Diffusion workflow with reference and ControlNet passes', 'Adobe Firefly concepting and Photoshop finishing']::text[] as workflows
),
seed as (
  select member_number
  from generate_series(1, 1000) as members(member_number)
),
profiles as (
  select
    seed.member_number,
    catalogs.first_names[((seed.member_number - 1) % cardinality(catalogs.first_names)) + 1]
      || ' ' ||
    catalogs.surnames[(floor((seed.member_number - 1)::numeric / cardinality(catalogs.first_names))::integer % cardinality(catalogs.surnames)) + 1]
      as full_name,
    catalogs.locations[((seed.member_number * 7 - 1) % cardinality(catalogs.locations)) + 1] as location,
    catalogs.categories[((seed.member_number * 3 - 1) % cardinality(catalogs.categories)) + 1] as category,
    catalogs.tools[((seed.member_number - 1) % cardinality(catalogs.tools)) + 1] as tool_one,
    catalogs.tools[((seed.member_number + 3) % cardinality(catalogs.tools)) + 1] as tool_two,
    catalogs.tools[((seed.member_number + 7) % cardinality(catalogs.tools)) + 1] as tool_three,
    catalogs.skill_catalog[((seed.member_number - 1) % cardinality(catalogs.skill_catalog)) + 1] as skill_one,
    catalogs.skill_catalog[((seed.member_number + 4) % cardinality(catalogs.skill_catalog)) + 1] as skill_two,
    catalogs.skill_catalog[((seed.member_number + 8) % cardinality(catalogs.skill_catalog)) + 1] as skill_three,
    catalogs.format_catalog[((seed.member_number - 1) % cardinality(catalogs.format_catalog)) + 1] as format_one,
    catalogs.format_catalog[((seed.member_number + 2) % cardinality(catalogs.format_catalog)) + 1] as format_two,
    catalogs.project_titles[((seed.member_number - 1) % cardinality(catalogs.project_titles)) + 1] as project_one,
    catalogs.project_titles[((seed.member_number + 3) % cardinality(catalogs.project_titles)) + 1] as project_two,
    catalogs.project_titles[((seed.member_number + 5) % cardinality(catalogs.project_titles)) + 1] as project_three,
    catalogs.workflows[((seed.member_number - 1) % cardinality(catalogs.workflows)) + 1] as workflow
  from seed
  cross join catalogs
)
insert into public.demo_creator_profiles (
  id, full_name, email, phone, category, location,
  minimum_budget_inr, maximum_budget_inr, skills, experience_level, ai_tools,
  portfolio_description, profile_picture_url, reference_images, reference_videos,
  previous_projects, availability, bio, completed_projects, completion_rate,
  verification_status, formats, commercial_use, workflow
)
select
  md5('creatorbridge-demo-creator-' || lpad(member_number::text, 4, '0'))::uuid,
  full_name,
  'creator.' || lpad(member_number::text, 4, '0') || '@example.test',
  '+1-202-555-01' || lpad((member_number % 100)::text, 2, '0'),
  category,
  location,
  2500 + ((member_number * 173) % 17500),
  2500 + ((member_number * 173) % 17500) + 10000 + ((member_number * 431) % 78000),
  array[skill_one, skill_two, skill_three],
  case member_number % 3 when 0 then 'Expert' when 1 then 'Intermediate' else 'Emerging' end,
  array[tool_one, tool_two, tool_three],
  'AI-native creative portfolio featuring ' || lower(category) || ', concept development, and production-ready campaign work.',
  'https://api.dicebear.com/9.x/initials/svg?seed=' || replace(full_name, ' ', '%20'),
  array[
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80'
  ],
  array['https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'],
  jsonb_build_array(
    jsonb_build_object('title', project_one, 'category', category, 'format', format_one, 'year', 2026),
    jsonb_build_object('title', project_two, 'category', category, 'format', format_two, 'year', 2025),
    jsonb_build_object('title', project_three, 'category', category, 'format', format_one, 'year', 2025)
  ),
  case when member_number % 4 = 0 then 'Available in 2 weeks' else 'Available now' end,
  'Independent AI creator developing original, human-directed work for thoughtful brands. Shares process, tools, and clear commercial-use terms with every collaboration.',
  5 + (member_number % 76),
  (80 + (member_number % 21))::numeric(5, 2),
  case member_number % 4 when 0 then 'Tools and workflow verified' when 1 then 'Past work verified' else 'Unverified' end,
  array[format_one, format_two],
  array['Paid social', 'Organic social', 'Web and digital'],
  workflow
from profiles
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  category = excluded.category,
  location = excluded.location,
  minimum_budget_inr = excluded.minimum_budget_inr,
  maximum_budget_inr = excluded.maximum_budget_inr,
  skills = excluded.skills,
  experience_level = excluded.experience_level,
  ai_tools = excluded.ai_tools,
  portfolio_description = excluded.portfolio_description,
  profile_picture_url = excluded.profile_picture_url,
  reference_images = excluded.reference_images,
  reference_videos = excluded.reference_videos,
  previous_projects = excluded.previous_projects,
  availability = excluded.availability,
  bio = excluded.bio,
  completed_projects = excluded.completed_projects,
  completion_rate = excluded.completion_rate,
  verification_status = excluded.verification_status,
  formats = excluded.formats,
  commercial_use = excluded.commercial_use,
  workflow = excluded.workflow;

select count(*) as creator_profile_count from public.demo_creator_profiles;

-- Core authenticated marketplace schema. Run once in the Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('creator', 'brand')),
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  specialty text not null default '',
  bio text not null default '',
  location text not null default '',
  skills text[] not null default '{}',
  tools_models text[] not null default '{}',
  formats text[] not null default '{}',
  commercial_use text[] not null default '{}',
  workflow text not null default '',
  minimum_budget numeric(12, 2) check (minimum_budget is null or minimum_budget >= 0),
  maximum_budget numeric(12, 2) check (maximum_budget is null or maximum_budget >= minimum_budget),
  experience_level text not null default 'Emerging',
  availability text not null default 'Available now',
  is_public boolean not null default true,
  verified_tools boolean not null default false,
  verified_workflow boolean not null default false,
  verified_past_work boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null default '',
  industry text not null default '',
  description text not null default '',
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  media_url text not null,
  content_type text not null default '',
  tools_models text[] not null default '{}',
  workflow text not null default '',
  aspect_ratio text not null default '',
  commercial_use text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.creative_briefs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brand_profiles (id) on delete cascade,
  title text not null,
  content_type text not null,
  project_description text not null default '',
  target_audience text not null default '',
  creative_style text not null default '',
  output_format text not null default 'Other',
  style text not null,
  aspect_ratio text not null,
  commercial_use text not null,
  duration text not null default '',
  budget numeric(12, 2) check (budget is null or budget >= 0),
  currency text not null default 'INR',
  deadline date,
  details text not null default '',
  additional_requirements text not null default '',
  reference_files text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creative_briefs
  add column if not exists project_description text not null default '',
  add column if not exists target_audience text not null default '',
  add column if not exists creative_style text not null default '',
  add column if not exists output_format text not null default 'Other',
  add column if not exists additional_requirements text not null default '',
  add column if not exists reference_files text[] not null default '{}';

create or replace function public.submit_creative_brief(p_brief jsonb)
returns public.creative_briefs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_brief public.creative_briefs%rowtype;
  budget_value numeric;
  reference_paths text[];
begin
  if current_user_id is null then
    raise exception 'Sign in with a brand account to submit a creative brief.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = current_user_id and role = 'brand'
  ) then
    raise exception 'Only brand accounts can submit a creative brief.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(p_brief) is distinct from 'object' then
    raise exception 'Brief data must be an object.'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(p_brief->>'title', ''))) not between 1 and 90
    or length(trim(coalesce(p_brief->>'project_description', ''))) not between 1 and 2000
    or length(trim(coalesce(p_brief->>'target_audience', ''))) not between 1 and 500 then
    raise exception 'Project name, description, or target audience is missing or too long.'
      using errcode = '22023';
  end if;

  if coalesce(p_brief->>'creative_style', '') not in ('Modern', 'Realistic', 'Cinematic', 'Minimalist', 'Professional', 'Artistic', 'Other')
    or coalesce(p_brief->>'output_format', '') not in ('Image', 'Video', 'Website Design', 'Social Media Content', 'Advertisement', 'Other')
    or coalesce(p_brief->>'commercial_use', '') not in ('Personal Use', 'Commercial Use', 'Educational Use', 'Other') then
    raise exception 'Choose a supported style, output format, and usage-rights option.'
      using errcode = '22023';
  end if;

  if length(coalesce(p_brief->>'additional_requirements', '')) > 2000 then
    raise exception 'Additional requirements cannot exceed 2000 characters.'
      using errcode = '22023';
  end if;

  if nullif(p_brief->>'budget', '') is not null then
    if (p_brief->>'budget') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' then
      raise exception 'Budget must be a non-negative amount with up to two decimal places.'
        using errcode = '22023';
    end if;
    budget_value := (p_brief->>'budget')::numeric;
  end if;

  if nullif(p_brief->>'deadline', '') is not null
    and (p_brief->>'deadline') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    raise exception 'Deadline must be a valid date.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_brief->'reference_files', '[]'::jsonb)) is distinct from 'array' then
    raise exception 'Reference files must be a list.'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(path), '{}'::text[])
  into reference_paths
  from jsonb_array_elements_text(coalesce(p_brief->'reference_files', '[]'::jsonb)) as item(path);

  if cardinality(reference_paths) > 5
    or exists (
      select 1 from unnest(reference_paths) as item(path)
      where path is null or path !~ ('^' || current_user_id::text || '/')
    ) then
    raise exception 'Reference files must belong to this brand and contain no more than five files.'
      using errcode = '22023';
  end if;

  insert into public.creative_briefs (
    brand_id, title, content_type, project_description, target_audience,
    creative_style, output_format, style, aspect_ratio, commercial_use,
    duration, budget, deadline, details, additional_requirements,
    reference_files, status
  )
  values (
    current_user_id,
    trim(p_brief->>'title'),
    p_brief->>'output_format',
    trim(p_brief->>'project_description'),
    trim(p_brief->>'target_audience'),
    p_brief->>'creative_style',
    p_brief->>'output_format',
    p_brief->>'creative_style',
    coalesce(nullif(p_brief->>'aspect_ratio', ''), 'Creator to recommend'),
    p_brief->>'commercial_use',
    coalesce(nullif(p_brief->>'duration', ''), ''),
    budget_value,
    nullif(p_brief->>'deadline', '')::date,
    coalesce(p_brief->>'details', ''),
    coalesce(p_brief->>'additional_requirements', ''),
    reference_paths,
    'open'
  )
  returning * into saved_brief;

  return saved_brief;
end;
$$;

revoke all on function public.submit_creative_brief(jsonb) from public, anon;
grant execute on function public.submit_creative_brief(jsonb) to authenticated;

create table if not exists public.creator_invitations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brand_profiles (id) on delete cascade,
  creator_id uuid not null references public.creator_profiles (id) on delete cascade,
  brief_id uuid not null references public.creative_briefs (id) on delete cascade,
  message text not null,
  status text not null default 'sent'
    check (status in ('sent', 'in_discussion', 'accepted', 'declined', 'hired', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, creator_id, brief_id)
);

create index if not exists creator_profiles_search_idx
  on public.creator_profiles using gin (skills, tools_models, formats);
create index if not exists portfolio_items_creator_idx
  on public.portfolio_items (creator_id, created_at desc);
create index if not exists creative_briefs_brand_idx
  on public.creative_briefs (brand_id, created_at desc);
create index if not exists creator_invitations_creator_idx
  on public.creator_invitations (creator_id, created_at desc);
create index if not exists creator_invitations_brand_idx
  on public.creator_invitations (brand_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists creator_profiles_set_updated_at on public.creator_profiles;
create trigger creator_profiles_set_updated_at before update on public.creator_profiles
for each row execute function public.set_updated_at();
drop trigger if exists brand_profiles_set_updated_at on public.brand_profiles;
create trigger brand_profiles_set_updated_at before update on public.brand_profiles
for each row execute function public.set_updated_at();
drop trigger if exists creative_briefs_set_updated_at on public.creative_briefs;
create trigger creative_briefs_set_updated_at before update on public.creative_briefs
for each row execute function public.set_updated_at();
drop trigger if exists creator_invitations_set_updated_at on public.creator_invitations;
create trigger creator_invitations_set_updated_at before update on public.creator_invitations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role text;
  new_name text;
begin
  new_role := case lower(coalesce(new.raw_user_meta_data ->> 'role', 'brand'))
    when 'creator' then 'creator'
    else 'brand'
  end;
  new_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''),
    new.email
  );

  insert into public.profiles (id, role, display_name, email)
  values (new.id, new_role, new_name, new.email);

  if new_role = 'creator' then
    insert into public.creator_profiles (id, specialty, skills)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'specialty', ''),
      case
        when jsonb_typeof(new.raw_user_meta_data -> 'skills') = 'array'
          then array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'skills'))
        else '{}'
      end
    );
  else
    insert into public.brand_profiles (id, company_name, industry, description, website)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), new_name),
      coalesce(new.raw_user_meta_data ->> 'industry', ''),
      coalesce(new.raw_user_meta_data ->> 'description', ''),
      nullif(new.raw_user_meta_data ->> 'website', '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.creative_briefs enable row level security;
alter table public.creator_invitations enable row level security;

drop policy if exists "Members can view their own profile" on public.profiles;
create policy "Members can view their own profile" on public.profiles
for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Public creator profiles are discoverable" on public.creator_profiles;
create policy "Public creator profiles are discoverable" on public.creator_profiles
for select to anon, authenticated using (is_public or id = (select auth.uid()));
drop policy if exists "Creators can insert their profile" on public.creator_profiles;
create policy "Creators can insert their profile" on public.creator_profiles
for insert to authenticated with check (
  id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'creator')
);
drop policy if exists "Creators can update their profile" on public.creator_profiles;
create policy "Creators can update their profile" on public.creator_profiles
for update to authenticated using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'creator')
);

drop policy if exists "Brands can view their profile" on public.brand_profiles;
create policy "Brands can view their profile" on public.brand_profiles
for select to authenticated using (id = (select auth.uid()));
drop policy if exists "Brands can update their profile" on public.brand_profiles;
create policy "Brands can update their profile" on public.brand_profiles
for update to authenticated using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
);

drop policy if exists "Public portfolios follow creator visibility" on public.portfolio_items;
create policy "Public portfolios follow creator visibility" on public.portfolio_items
for select to anon, authenticated using (
  exists (
    select 1 from public.creator_profiles
    where id = creator_id and (is_public or id = (select auth.uid()))
  )
);
drop policy if exists "Creators manage their portfolio" on public.portfolio_items;
create policy "Creators manage their portfolio" on public.portfolio_items
for all to authenticated using (creator_id = (select auth.uid()))
with check (
  creator_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'creator')
);

drop policy if exists "Brands and invited creators can view briefs" on public.creative_briefs;
create policy "Brands and invited creators can view briefs" on public.creative_briefs
for select to authenticated using (
  brand_id = (select auth.uid())
  or exists (
    select 1 from public.creator_invitations
    where brief_id = id and creator_id = (select auth.uid())
  )
);
drop policy if exists "Brands manage their briefs" on public.creative_briefs;
create policy "Brands manage their briefs" on public.creative_briefs
for all to authenticated using (
  brand_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
)
with check (
  brand_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
);

drop policy if exists "Invitation parties can view invitations" on public.creator_invitations;
create policy "Invitation parties can view invitations" on public.creator_invitations
for select to authenticated using (
  brand_id = (select auth.uid()) or creator_id = (select auth.uid())
);
drop policy if exists "Brands can create invitations for their briefs" on public.creator_invitations;
create policy "Brands can create invitations for their briefs" on public.creator_invitations
for insert to authenticated with check (
  brand_id = (select auth.uid())
  and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'brand'
  )
  and exists (
    select 1 from public.creative_briefs
    where id = brief_id and brand_id = (select auth.uid())
  )
);
drop policy if exists "Invitation parties can update invitation status" on public.creator_invitations;
create policy "Invitation parties can update invitation status" on public.creator_invitations
for update to authenticated using (
  brand_id = (select auth.uid()) or creator_id = (select auth.uid())
)
with check (
  brand_id = (select auth.uid()) or creator_id = (select auth.uid())
);

grant select on public.creator_profiles, public.portfolio_items to anon, authenticated;
grant select, update (display_name, email) on public.profiles to authenticated;
grant insert (
  id, specialty, bio, location, skills, tools_models, formats, commercial_use,
  workflow, minimum_budget, maximum_budget, experience_level, availability, is_public
) on public.creator_profiles to authenticated;
grant update (
  specialty, bio, location, skills, tools_models, formats, commercial_use,
  workflow, minimum_budget, maximum_budget, experience_level, availability, is_public
) on public.creator_profiles to authenticated;
grant select, update on public.brand_profiles to authenticated;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant select, insert, update, delete on public.creative_briefs to authenticated;
grant select, insert on public.creator_invitations to authenticated;
grant update (status) on public.creator_invitations to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creative-brief-references',
  'creative-brief-references',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Brand owners can view their brief references" on storage.objects;
create policy "Brand owners can view their brief references" on storage.objects
for select to authenticated using (
  bucket_id = 'creative-brief-references'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
);
drop policy if exists "Brand owners can upload their brief references" on storage.objects;
create policy "Brand owners can upload their brief references" on storage.objects
for insert to authenticated with check (
  bucket_id = 'creative-brief-references'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
);
drop policy if exists "Brand owners can delete their brief references" on storage.objects;
create policy "Brand owners can delete their brief references" on storage.objects
for delete to authenticated using (
  bucket_id = 'creative-brief-references'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'brand')
);

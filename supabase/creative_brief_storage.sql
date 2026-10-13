-- Apply after app_schema.sql to add the structured brief fields and private uploads.
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

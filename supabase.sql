create schema if not exists public;
set search_path to public;
create extension if not exists pgcrypto;
create extension if not exists moddatetime schema extensions;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  plan text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int,
  issue_type text,
  resolved boolean,
  recording_url text,
  transcript_url text,
  cost_cents int,
  source text default 'vapi',
  created_at timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table if not exists caregivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text, phone text, email text, receive_sms boolean default true,
  created_at timestamptz default now()
);

create table if not exists webhook_event_logs (
  id bigserial primary key,
  source text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create or replace function public.minutes_used_current_month()
returns integer language plpgsql security definer set search_path=public as $$
declare mins integer;
begin
  select coalesce(round(sum(duration_seconds)/60.0),0)::int into mins
  from public.calls
  where user_id = auth.uid()
    and date_trunc('month', started_at) = date_trunc('month', now());
  return mins;
end; $$;

revoke all on function public.minutes_used_current_month() from public;
grant execute on function public.minutes_used_current_month() to authenticated;

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table calls enable row level security;
alter table members enable row level security;
alter table caregivers enable row level security;
alter table webhook_event_logs enable row level security;

drop policy if exists "profiles select self" on profiles;
drop policy if exists "profiles insert self" on profiles;
drop policy if exists "profiles update self" on profiles;
drop policy if exists "profiles delete self" on profiles;
create policy "profiles select self" on profiles for select using (id = auth.uid());
create policy "profiles insert self" on profiles for insert with check (id = auth.uid());
create policy "profiles update self" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles delete self" on profiles for delete using (id = auth.uid());

drop policy if exists "subs select self" on subscriptions;
drop policy if exists "subs insert self" on subscriptions;
drop policy if exists "subs update self" on subscriptions;
drop policy if exists "subs delete self" on subscriptions;
create policy "subs select self" on subscriptions for select using (user_id = auth.uid());
create policy "subs insert self" on subscriptions for insert with check (user_id = auth.uid());
create policy "subs update self" on subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subs delete self" on subscriptions for delete using (user_id = auth.uid());

drop policy if exists "calls select self" on calls;
drop policy if exists "calls insert self" on calls;
drop policy if exists "calls update self" on calls;
drop policy if exists "calls delete self" on calls;
create policy "calls select self" on calls for select using (user_id = auth.uid());
create policy "calls insert self" on calls for insert with check (user_id = auth.uid());
create policy "calls update self" on calls for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "calls delete self" on calls for delete using (user_id = auth.uid());

drop policy if exists "members select self" on members;
drop policy if exists "members insert self" on members;
drop policy if exists "members update self" on members;
drop policy if exists "members delete self" on members;
create policy "members select self" on members for select using (user_id = auth.uid());
create policy "members insert self" on members for insert with check (user_id = auth.uid());
create policy "members update self" on members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members delete self" on members for delete using (user_id = auth.uid());

drop policy if exists "caregivers select self" on caregivers;
drop policy if exists "caregivers insert self" on caregivers;
drop policy if exists "caregivers update self" on caregivers;
drop policy if exists "caregivers delete self" on caregivers;
create policy "caregivers select self" on caregivers for select using (user_id = auth.uid());
create policy "caregivers insert self" on caregivers for insert with check (user_id = auth.uid());
create policy "caregivers update self" on caregivers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "caregivers delete self" on caregivers for delete using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

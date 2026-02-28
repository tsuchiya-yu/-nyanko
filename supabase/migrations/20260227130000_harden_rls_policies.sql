-- Harden RLS policies for public tables.
-- Issue: https://github.com/tsuchiya-yu/-nyanko/issues/86

-- -----------------------------------------------------------------------------
-- cache: restrict write operations to service_role only.
-- -----------------------------------------------------------------------------
alter table if exists public.cache enable row level security;

drop policy if exists "Service role can manage cache" on public.cache;
drop policy if exists "Service role can read cache" on public.cache;
drop policy if exists "Service role can insert cache" on public.cache;
drop policy if exists "Service role can update cache" on public.cache;
drop policy if exists "Service role can delete cache" on public.cache;

create policy "Service role can read cache"
    on public.cache
    for select
    using (auth.role() = 'service_role');

create policy "Service role can insert cache"
    on public.cache
    for insert
    with check (auth.role() = 'service_role');

create policy "Service role can update cache"
    on public.cache
    for update
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

create policy "Service role can delete cache"
    on public.cache
    for delete
    using (auth.role() = 'service_role');

revoke insert, update, delete on table public.cache from anon, authenticated;

-- -----------------------------------------------------------------------------
-- news/columns: update permissions must be admin only via JWT claim.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select lower(coalesce(auth.jwt() ->> 'is_admin', 'false')) = 'true';
$$;

grant execute on function public.is_admin() to authenticated;

alter table if exists public.news enable row level security;
alter table if exists public.columns enable row level security;

drop policy if exists "Authenticated users can manage news" on public.news;
drop policy if exists "Authenticated users can manage columns" on public.columns;

create policy "Admin can insert news"
    on public.news
    for insert
    with check (public.is_admin());

create policy "Admin can update news"
    on public.news
    for update
    using (public.is_admin())
    with check (public.is_admin());

create policy "Admin can delete news"
    on public.news
    for delete
    using (public.is_admin());

create policy "Admin can insert columns"
    on public.columns
    for insert
    with check (public.is_admin());

create policy "Admin can update columns"
    on public.columns
    for update
    using (public.is_admin())
    with check (public.is_admin());

create policy "Admin can delete columns"
    on public.columns
    for delete
    using (public.is_admin());

revoke insert, update, delete on table public.news from anon, authenticated;
revoke insert, update, delete on table public.columns from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Optional legacy tables: if they exist, block anon/authenticated access.
-- -----------------------------------------------------------------------------
do $$
declare
    tbl text;
    pol record;
begin
    foreach tbl in array array['blog_posts', 'cat_info', 'gallery']
    loop
        if to_regclass(format('public.%I', tbl)) is not null then
            execute format('alter table public.%I enable row level security', tbl);

            for pol in
                select policyname
                from pg_policies
                where schemaname = 'public' and tablename = tbl
            loop
                execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
            end loop;

            execute format('revoke all on table public.%I from anon, authenticated', tbl);
        end if;
    end loop;
end
$$;

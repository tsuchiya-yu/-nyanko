-- Create favorites table
create table if not exists public.favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    cat_id uuid references public.cats(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, cat_id)
);

-- Enable RLS
alter table if exists public.favorites enable row level security;

-- RLS policies for favorites
create policy "Users can view their own favorites"
    on public.favorites for select
    using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
    on public.favorites for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
    on public.favorites for delete
    using (auth.uid() = user_id);
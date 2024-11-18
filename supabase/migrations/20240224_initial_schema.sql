-- Enable RLS (Row Level Security)
alter table if exists public.profiles enable row level security;
alter table if exists public.cats enable row level security;

-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cats table
create table if not exists public.cats (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    age integer not null check (age >= 0),
    breed text not null,
    description text not null,
    image_url text not null,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies for profiles
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- RLS policies for cats
create policy "Cats are viewable by everyone"
    on public.cats for select
    using (true);

create policy "Users can insert their own cats"
    on public.cats for insert
    with check (auth.uid() = owner_id);

create policy "Users can update their own cats"
    on public.cats for update
    using (auth.uid() = owner_id);

create policy "Users can delete their own cats"
    on public.cats for delete
    using (auth.uid() = owner_id);
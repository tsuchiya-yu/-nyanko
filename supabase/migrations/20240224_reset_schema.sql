-- Drop existing tables and policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Cats are viewable by everyone" on public.cats;
drop policy if exists "Users can insert their own cats" on public.cats;
drop policy if exists "Users can update their own cats" on public.cats;
drop policy if exists "Users can delete their own cats" on public.cats;
drop policy if exists "Users can view their own favorites" on public.favorites;
drop policy if exists "Users can insert their own favorites" on public.favorites;
drop policy if exists "Users can delete their own favorites" on public.favorites;

drop table if exists public.favorites;
drop table if exists public.cat_photos;
drop table if exists public.cats;
drop table if exists public.profiles;

-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cats table
create table public.cats (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    birthdate date not null,
    is_birthdate_estimated boolean default false,
    breed text not null,
    catchphrase text,
    description text not null,
    image_url text not null,
    owner_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cat photos table
create table public.cat_photos (
    id uuid default gen_random_uuid() primary key,
    cat_id uuid references public.cats(id) on delete cascade not null,
    image_url text not null,
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create favorites table
create table public.favorites (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    cat_id uuid references public.cats(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, cat_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.cat_photos enable row level security;
alter table public.favorites enable row level security;

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

-- RLS policies for cat photos
create policy "Cat photos are viewable by everyone"
    on public.cat_photos for select
    using (true);

create policy "Users can insert photos for their cats"
    on public.cat_photos for insert
    with check (
        auth.uid() = (
            select owner_id from public.cats where id = cat_id
        )
    );

create policy "Users can delete photos of their cats"
    on public.cat_photos for delete
    using (
        auth.uid() = (
            select owner_id from public.cats where id = cat_id
        )
    );

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

-- Insert sample data
insert into public.profiles (id, name, avatar_url)
values
    ('d0d8488e-b86e-4e35-88c7-3e39c4b978d6', '猫野 花子', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'),
    ('f5b57068-f0c9-4d39-8f6c-1f8f557f777f', '佐藤 太郎', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e');

insert into public.cats (id, name, birthdate, is_birthdate_estimated, breed, catchphrase, description, image_url, owner_id)
values
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'モカ', '2020-04-15', false, 'スコティッシュフォールド', 'いつも元気いっぱい！甘えん坊な女の子♪', '人懐っこくて、来客時もすぐに膝の上に乗ってきます。おやつの時間が大好きで、音を聞くとどこからともなく現れます。', 'https://images.unsplash.com/photo-1513245543132-31f507417b26', 'd0d8488e-b86e-4e35-88c7-3e39c4b978d6'),
    ('b49cb104-9c63-4b45-a5b3-76c13d3b6f8c', 'ソラ', '2021-07-20', true, '雑種', '空のように自由な男の子', '保護猫として迎えました。最初は人見知りでしたが、今では家族の一員として毎日楽しく過ごしています。', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'f5b57068-f0c9-4d39-8f6c-1f8f557f777f');

insert into public.cat_photos (cat_id, image_url, comment)
values
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec', '初めてのおもちゃに夢中！'),
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803', 'お昼寝タイム'),
    ('b49cb104-9c63-4b45-a5b3-76c13d3b6f8c', 'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6', 'キャットタワーからの眺め');
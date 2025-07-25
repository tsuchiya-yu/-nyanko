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
drop policy if exists "News are viewable by everyone" on public.news;
drop policy if exists "Authenticated users can manage news" on public.news;
drop policy if exists "Columns are viewable by everyone" on public.columns;
drop policy if exists "Authenticated users can manage columns" on public.columns;
drop policy if exists "Service role can manage cache" on public.cache;

drop table if exists public.favorites;
drop table if exists public.cat_photos;
drop table if exists public.cats;
drop table if exists public.profiles;
drop table if exists public.news;
drop table if exists public.columns;
drop table if exists public.cache;

-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Create sitemap generation function
create or replace function generate_sitemap()
returns void
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := current_setting('app.settings.supabase_function_url') || '/generate-sitemap',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );
end;
$$;

-- Schedule sitemap generation
select cron.schedule(
  'generate-sitemap-daily',
  '0 0 * * *',  -- 毎日午前0時
  $$select generate_sitemap()$$
);

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
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    birthdate date not null,
    is_birthdate_estimated boolean default false not null,
    breed text not null,
    catchphrase text,
    description text not null,
    image_url text,
    instagram_url text,
    youtube_url text,
    tiktok_url text,
    x_url text,
    homepage_url text,
    gender text,
    background_color text default '#FFFFFF',
    text_color text default '#000000',
    is_public boolean default true not null,
    owner_id uuid references public.profiles(id) on delete cascade not null
);

-- Create cat photos table
create table public.cat_photos (
    id uuid default gen_random_uuid() primary key,
    cat_id uuid references public.cats(id) on delete cascade not null,
    image_url text not null,
    comment text,
    cat_mood text,
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

-- Create news table
create table public.news (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    published_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    content text not null,
    is_published boolean default true not null,
    slug text unique not null
);

-- Create columns table
create table public.columns (
    id uuid default gen_random_uuid() primary key,
    slug text not null unique,
    title text not null,
    content text not null,
    image_url text,
    published_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cache table for storing API responses
create table public.cache (
    key text primary key,
    value integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone not null
);

-- Function to automatically delete expired cache entries
create or replace function delete_expired_cache() returns trigger as $$
begin
    delete from cache where expires_at < now();
    return null;
end;
$$ language plpgsql;

-- Trigger to clean up expired cache on insert
drop trigger if exists trigger_delete_expired_cache on cache;
create trigger trigger_delete_expired_cache
after insert on cache
execute procedure delete_expired_cache();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.cat_photos enable row level security;
alter table public.favorites enable row level security;
alter table public.news enable row level security;
alter table public.columns enable row level security;
alter table public.cache enable row level security;

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

-- RLS policies for news
create policy "News are viewable by everyone"
    on public.news for select
    using (is_published = true);

create policy "Authenticated users can manage news"
    on public.news for all
    using (auth.role() = 'authenticated');

-- RLS policies for columns
create policy "Columns are viewable by everyone"
    on public.columns for select
    using (true);

create policy "Authenticated users can manage columns"
    on public.columns for all
    using (auth.role() = 'authenticated');

-- RLS policies for cache
create policy "Service role can manage cache" on public.cache
    for all
    using (true)
    with check (true);

-- Insert sample data
insert into public.profiles (id, name, avatar_url)
values
    ('3e07891a-4d8b-4d8f-9748-bc59b3d02e1b', '猫野 花子', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'),
    ('fae59c15-b0a4-4681-9e0a-083bf285bac6', '佐藤 太郎', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e');

insert into public.cats (id, name, birthdate, is_birthdate_estimated, breed, catchphrase, description, image_url, instagram_url, youtube_url, tiktok_url, x_url, homepage_url, owner_id, gender)
values
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'モカ', '2020-04-15', false, 'スコティッシュフォールド', 'いつも元気いっぱい！甘えん坊な女の子♪', '人懐っこくて、来客時もすぐに膝の上に乗ってきます。おやつの時間が大好きで、音を聞くとどこからともなく現れます。', 'https://images.unsplash.com/photo-1513245543132-31f507417b26', 'https://www.instagram.com/moka_scottish/', 'https://www.youtube.com/@moka_scottish', 'https://www.tiktok.com/@moka_scottish', 'https://x.com/moka_chan', 'https://caitsith22.com/', '3e07891a-4d8b-4d8f-9748-bc59b3d02e1b', '女の子'),
    ('b49cb104-9c63-4b45-a5b3-76c13d3b6f8c', 'ソラ', '2021-07-20', true, '雑種', '空のように自由な男の子', '保護猫として迎えました。最初は人見知りでしたが、今では家族の一員として毎日楽しく過ごしています。', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'https://www.instagram.com/sora_freedom/', 'https://www.youtube.com/@sora_freedom', null, null, null, 'fae59c15-b0a4-4681-9e0a-083bf285bac6', '女の子');

insert into public.cat_photos (cat_id, image_url, comment)
values
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec', '初めてのおもちゃに夢中！'),
    ('897badee-71fd-40f9-a006-f8d7606f38d2', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803', 'お昼寝タイム'),
    ('b49cb104-9c63-4b45-a5b3-76c13d3b6f8c', 'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6', 'キャットタワーからの眺め');

-- Insert sample news
insert into public.news (title, content, published_at, slug)
values
    ('「ねこのひとこと」機能をアップデートしました！', 'より自然な猫の気持ちを表現できるようになりました。新しいAIモデルを導入し、より細かな表情や仕草の分析が可能になりました。', '2024-03-21 00:00:00+00', 'ai-update-202403'),
    ('写真のアップロード枚数を増やしました', '最大30枚までアップロード可能になりました。思い出の写真をより多く共有できるようになりました。', '2024-03-15 00:00:00+00', 'photo-limit-update-202403'),
    ('CAT LINKをリリースしました！', 'ついにCAT LINKをリリースしました。あなたの愛猫のプロフィールページを作成して、大切な思い出を残しましょう。', '2024-03-01 00:00:00+00', 'service-launch-202403');

-- Insert sample columns
insert into public.columns (slug, title, content, image_url, published_at)
values
    ('cat-care-essentials', 'はじめての猫との暮らし：必要なものリスト', '<h2>はじめに</h2><p>猫を迎える準備をしていますか？新しい家族を迎えるには、いくつかの必需品が必要です。</p><h2>1. 食事関連のアイテム</h2><ul><li>高品質のキャットフード（年齢に合わせたもの）</li><li>清潔な水を保つための給水器</li><li>食器（できれば浅めの物）</li></ul><h2>2. トイレ関連</h2><ul><li>猫用トイレ（カバー付きかオープンタイプか検討を）</li><li>猫砂（いくつかの種類を試してみるのもおすすめ）</li><li>スコップ</li></ul><h2>3. 遊びと休息のために</h2><ul><li>キャットタワーや棚（高い場所が大好きです）</li><li>おもちゃ（羽根つき、ボール、ネズミ型など）</li><li>爪とぎ（縦型と横型両方あると良いでしょう）</li><li>居心地の良いベッドやブランケット</li></ul><h2>4. 移動用</h2><ul><li>キャリーケース（獣医visits用）</li></ul><h2>5. グルーミング用品</h2><ul><li>ブラシ（猫の毛の長さに合わせて）</li><li>爪切り</li></ul><p><a href="https://cat-link.catnote.tokyo" target="_blank" rel="noopener noreferrer">CAT LINK</a>でもっと詳しく猫との暮らしについて学びましょう！</p>', 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c', '2024-03-05 00:00:00+00'),
    ('understanding-cat-behavior', '猫の行動を理解する：しっぽの動きが教えてくれること', '<h2>はじめに</h2><p>猫は言葉を話せませんが、体で多くを語っています。特にしっぽは猫の感情の優れた指標です。</p><h2>しっぽの動きと意味</h2><h3>まっすぐ上に立ったしっぽ</h3><p>猫が幸せで自信を持っているサインです。あなたに会えて嬉しいと伝えています。</p><h3>ゆっくりと揺れるしっぽ</h3><p>何かに集中している時のポーズです。狩りの態勢かもしれません。</p><h3>激しく左右に振るしっぽ</h3><p>イライラや怒りのサイン。この時は距離を置くのが賢明です。</p><h3>ふわふわに膨らんだしっぽ</h3><p>驚いたり怖がったりしている時に見られます。</p><h3>足の間に隠されたしっぽ</h3><p>不安や恐怖を感じている時のサイン。安心できる環境を提供しましょう。</p><h2>まとめ</h2><p>しっぽだけでなく、耳や目、体の姿勢も組み合わせて観察すると、あなたの猫がどう感じているかをより深く理解できるでしょう。</p><p><a href="https://cat-link.catnote.tokyo" target="_blank" rel="noopener noreferrer">CAT LINK</a>で愛猫との絆を深めましょう！</p>', 'https://images.unsplash.com/photo-1511044568932-338c0ad803', '2024-03-10 00:00:00+00'),
    ('benefits-of-adopting-senior-cats', 'シニア猫を迎える10の魅力', '<h2>はじめに</h2><p>シニア猫（7歳以上）の魅力をご存知ですか？保護施設では若い猫に比べて見過ごされがちなシニア猫ですが、実は多くの利点があります。</p><h2>シニア猫の10の魅力</h2><ol><li><strong>性格が安定している</strong><br>年を重ねた猫は、すでに性格が形成されているので、どんな子かすぐにわかります。</li><li><strong>しつけが済んでいる</strong><br>ほとんどのシニア猫はトイレのしつけが済んでいます。</li><li><strong>落ち着いている</strong><br>子猫のような激しい遊びや夜中の暴れんぼうが少なく、穏やかな時間を過ごせます。</li><li><strong>感謝の気持ちが深い</strong><br>多くのシニア猫は、新しい家族に対する感謝の気持ちを示してくれます。</li><li><strong>家具への被害が少ない</strong><br>爪とぎや噛み癖などの問題行動が少ない傾向があります。</li><li><strong>医療履歴がわかっている</strong><br>多くの場合、健康状態や医療履歴が明確です。</li><li><strong>ずっと一緒に暮らせる</strong><br>シニアでも10歳以上生きる猫は多く、長い時間を共に過ごせます。</li><li><strong>子供にも優しい</strong><br>落ち着いた猫は子供にも忍耐強く接することが多いです。</li><li><strong>即座に家族の一員に</strong><br>適応が早く、すぐに家族の一員となってくれます。</li><li><strong>命を救える喜び</strong><br>シニア猫を迎えることは、本当の意味での「救済」となることが多いです。</li></ol><h2>まとめ</h2><p><a href="https://cat-link.catnote.tokyo" target="_blank" rel="noopener noreferrer">CAT LINK</a>では、シニア猫たちの魅力的なプロフィールも多数掲載しています。素敵な出会いを見つけてください。</p>', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5', '2024-03-15 00:00:00+00');
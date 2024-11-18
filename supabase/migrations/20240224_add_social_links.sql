-- Add social media columns to cats table
alter table public.cats
add column instagram_url text,
add column x_url text;
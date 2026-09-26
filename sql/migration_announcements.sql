-- Run this if you already ran the original schema.sql — adds cook/admin announcements.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid references profiles(id) not null,
  message text not null,
  image_url text,
  created_at timestamptz default now()
);

alter table announcements enable row level security;

create policy "read announcements" on announcements for select using (true);
create policy "staff post announcements" on announcements for insert with check (is_staff());

alter publication supabase_realtime add table announcements;

-- Also create a public storage bucket for announcement photos & food images.
-- Run this separately in Supabase Dashboard > Storage > New bucket, name it "public-images", set to Public.
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('public-images', 'public-images', true)
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select using (bucket_id = 'public-images');
create policy "staff upload images" on storage.objects for insert with check (
  bucket_id = 'public-images' and is_staff()
);

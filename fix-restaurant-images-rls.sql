-- restaurant_images 테이블 RLS 정책 설정
-- Supabase 쿼리 콘솔에서 실행하세요

-- ========================================
-- 1. Storage 버킷 RLS 정책
-- ========================================

-- 기존 Storage 정책 삭제
drop policy if exists "restaurant images storage select" on storage.objects;
drop policy if exists "restaurant images storage insert" on storage.objects;
drop policy if exists "restaurant images storage update" on storage.objects;
drop policy if exists "restaurant images storage delete" on storage.objects;

-- 모든 사람이 restaurant-images 버킷의 파일을 볼 수 있음
create policy "restaurant images storage select"
on storage.objects for select
using ( bucket_id = 'restaurant-images' );

-- 인증된 사용자만 restaurant-images 버킷에 업로드 가능
create policy "restaurant images storage insert"
on storage.objects for insert
with check (
  bucket_id = 'restaurant-images' 
  and auth.uid() is not null
);

-- 인증된 사용자만 자신이 업로드한 파일 수정 가능
create policy "restaurant images storage update"
on storage.objects for update
using (
  bucket_id = 'restaurant-images' 
  and auth.uid() = owner
);

-- 인증된 사용자만 자신이 업로드한 파일 삭제 가능
create policy "restaurant images storage delete"
on storage.objects for delete
using (
  bucket_id = 'restaurant-images' 
  and auth.uid() = owner
);

-- ========================================
-- 2. restaurant_images 테이블 RLS 정책
-- ========================================

-- RLS 활성화
alter table public.restaurant_images enable row level security;

-- 기존 정책 삭제 (있다면)
drop policy if exists "restaurant_images public read" on public.restaurant_images;
drop policy if exists "restaurant_images authenticated insert" on public.restaurant_images;
drop policy if exists "restaurant_images delete own" on public.restaurant_images;
drop policy if exists "restaurant_images update own" on public.restaurant_images;

-- 모든 사람이 이미지를 읽을 수 있도록 (공개)
create policy "restaurant_images public read" 
on public.restaurant_images
for select
using (true);

-- 인증된 사용자만 이미지를 업로드할 수 있도록
create policy "restaurant_images authenticated insert" 
on public.restaurant_images
for insert
with check (auth.uid() is not null);

-- 본인이 등록한 맛집의 이미지만 삭제 가능
create policy "restaurant_images delete own" 
on public.restaurant_images
for delete
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_images.restaurant_id
      and r.created_by = auth.uid()
  )
);

-- 본인이 등록한 맛집의 이미지만 수정 가능
create policy "restaurant_images update own" 
on public.restaurant_images
for update
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_images.restaurant_id
      and r.created_by = auth.uid()
  )
);

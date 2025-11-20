-- 정책이 없다면 리뷰 삭제가 차단되므로, 본인 리뷰 및 리뷰 이미지를 삭제할 수 있도록 RLS 정책을 추가합니다.
-- Supabase 쿼리 콘솔에서 실행하거나, 마이그레이션에 포함하세요.

alter table public.reviews enable row level security;
alter table public.review_images enable row level security;

create policy if not exists "reviews delete self" on public.reviews
for delete
using (user_id = auth.uid());

create policy if not exists "review_images delete self" on public.review_images
for delete
using (
  exists (
    select 1
    from public.reviews rv
    where rv.id = review_images.review_id
      and rv.user_id = auth.uid()
  )
);

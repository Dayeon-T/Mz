-- ===========================================================
-- 🍱 맛집 지도 서비스 DB 스키마 (Supabase)
-- ===========================================================

-- 확장 설치
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- ===========================================================
-- 1. 사용자 프로필
-- ===========================================================
create table if not exists public.profiles (
id uuid primary key references auth.users(id) on delete cascade,
email text not null unique,
nickname text not null unique,
avatar_url text,
created_at timestamptz default now()
);
create index if not exists idx_profiles_nickname_trgm
on public.profiles using gin (nickname gin_trgm_ops);

-- ===========================================================
-- 2. 카테고리
-- ===========================================================
create table if not exists public.categories (
id bigserial primary key,
name text not null unique,
slug text generated always as (lower(regexp_replace(name, '\s+', '-', 'g'))) stored unique
);

create table if not exists public.restaurant_categories (
restaurant_id uuid not null,
category_id bigint not null references public.categories(id) on delete cascade,
primary key (restaurant_id, category_id)
);

-- ===========================================================
-- 3. 맛집 (지도 마커 + 기본정보)
-- ===========================================================
create table if not exists public.restaurants (
id uuid primary key default gen_random_uuid(),
created_by uuid not null references public.profiles(id) on delete restrict,
name text not null,
address text not null,
phone text,
open_time time not null,
close_time time not null,
break_start time,
break_end time,
lat double precision not null,
lng double precision not null,
geog geography(Point, 4326) generated always as (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) stored,
has_takeout boolean default false,
has_delivery boolean default false,
has_reservation boolean default false,
has_parking boolean default false,
has_wifi boolean default false,
marker_emoji text,
tagline text,
extra_note text,
created_at timestamptz default now(),
unique (name, address)
);
create index if not exists idx_restaurants_geog on public.restaurants using gist (geog);
create index if not exists idx_restaurants_name_trgm on public.restaurants using gin (name gin_trgm_ops);

-- ===========================================================
-- 4. 맛집 이미지 (여러장)
-- ===========================================================
create table if not exists public.restaurant_images (
id uuid primary key default gen_random_uuid(),
restaurant_id uuid not null references public.restaurants(id) on delete cascade,
url text not null,
sort_order int default 0,
created_at timestamptz default now()
);
create index if not exists idx_restaurant_images_restaurant on public.restaurant_images(restaurant_id, sort_order);

-- ===========================================================
-- 5. 리뷰 / 별점 / 방문일 / 포토 / 평가 태그
-- ===========================================================
do $$ begin
create type review_tag as enum ('tasty', 'interior', 'clean', 'kind');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
id uuid primary key default gen_random_uuid(),
restaurant_id uuid not null references public.restaurants(id) on delete cascade,
user_id uuid not null references public.profiles(id) on delete cascade,
rating int not null check (rating between 1 and 5),
visit_date date not null,
text_content text,
created_at timestamptz default now(),
updated_at timestamptz default now(),
unique (restaurant_id, user_id, visit_date)
);
create index if not exists idx_reviews_restaurant on public.reviews(restaurant_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

create table if not exists public.review_tags (
review_id uuid not null references public.reviews(id) on delete cascade,
tag review_tag not null,
primary key (review_id, tag)
);

create table if not exists public.review_images (
id uuid primary key default gen_random_uuid(),
review_id uuid not null references public.reviews(id) on delete cascade,
url text not null,
sort_order int default 0,
created_at timestamptz default now()
);

-- ===========================================================
-- 6. 즐겨찾기 & 최근 본 가게
-- ===========================================================
create table if not exists public.favorites (
user_id uuid not null references public.profiles(id) on delete cascade,
restaurant_id uuid not null references public.restaurants(id) on delete cascade,
created_at timestamptz default now(),
primary key (user_id, restaurant_id)
);

create table if not exists public.recent_views (
id bigserial primary key,
user_id uuid not null references public.profiles(id) on delete cascade,
restaurant_id uuid not null references public.restaurants(id) on delete cascade,
viewed_at timestamptz default now()
);
create index if not exists idx_recent_views_user_time on public.recent_views(user_id, viewed_at desc);

-- ===========================================================
-- 7. 맛집 통계 뷰 (평균별점, 리뷰수)
-- ===========================================================
create or replace view public.restaurant_stats as
select
r.id as restaurant_id,
coalesce(avg(rv.rating)::numeric(3,2), 0) as avg_rating,
count(rv.id) as review_count
from public.restaurants r
left join public.reviews rv on rv.restaurant_id = r.id
group by r.id;

-- ===========================================================
-- 8. 영업중 여부 판정 함수
-- ===========================================================
create or replace function public.is_open_now(
\_open time, \_close time, \_break_start time, \_break_end time, \_now timestamptz default now()
) returns boolean
language plpgsql stable as $$
declare
  t time := (_now at time zone 'UTC')::time;
begin
  if _open <= _close then
    if not (t >= _open and t < _close) then return false; end if;
  else
    if not (t >= _open or t < _close) then return false; end if;
  end if;
  if _break_start is not null and _break_end is not null then
    if _break_start <= _break_end then
      if t >= _break_start and t < _break_end then return false; end if;
    else
      if (t >= _break_start or t < _break_end) then return false; end if;
    end if;
  end if;
  return true;
end $$;

-- ===========================================================
-- 9. RLS 정책 (기본: 전체 읽기, 본인만 쓰기)
-- ===========================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.restaurant_categories enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_images enable row level security;
alter table public.reviews enable row level security;
alter table public.review_tags enable row level security;
alter table public.review_images enable row level security;
alter table public.favorites enable row level security;
alter table public.recent_views enable row level security;

-- profiles: 자기만 조회/수정
create policy "profiles self select" on public.profiles
for select using (id = auth.uid());
create policy "profiles self update" on public.profiles
for update using (id = auth.uid());

-- 모두 읽기 허용
create policy "read all restaurants" on public.restaurants for select using (true);
create policy "read all images" on public.restaurant_images for select using (true);
create policy "read all categories" on public.categories for select using (true);
create policy "read all reviews" on public.reviews for select using (true);
create policy "read all review_images" on public.review_images for select using (true);
create policy "read all review_tags" on public.review_tags for select using (true);

create policy "categories insert self" on public.categories
for insert with check (auth.role() = 'authenticated');
create policy "categories update self" on public.categories
for update using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
create policy "restaurant_categories insert self" on public.restaurant_categories
for insert with check (
exists (
select 1
from public.restaurants r
where r.id = restaurant_categories.restaurant_id
and r.created_by = auth.uid()
)
);
create policy "restaurant_categories delete self" on public.restaurant_categories
for delete using (
exists (
select 1
from public.restaurants r
where r.id = restaurant_categories.restaurant_id
and r.created_by = auth.uid()
)
);

-- 맛집 작성자만 insert/update
create policy "restaurants insert owner" on public.restaurants
for insert with check (created_by = auth.uid());
create policy "restaurants update owner" on public.restaurants
for update using (created_by = auth.uid());

-- 이미지: 본인 맛집만
create policy "restaurant_images insert owner" on public.restaurant_images
for insert with check (
exists (select 1 from public.restaurants r where r.id = restaurant_images.restaurant_id and r.created_by = auth.uid())
);
create policy "restaurant_images update owner" on public.restaurant_images
for update using (
exists (select 1 from public.restaurants r where r.id = restaurant_images.restaurant_id and r.created_by = auth.uid())
);

-- 리뷰: 본인만 insert/update
create policy "reviews insert self" on public.reviews
for insert with check (user_id = auth.uid());
create policy "reviews update self" on public.reviews
for update using (user_id = auth.uid());

-- 리뷰 이미지/태그: 본인 리뷰만 수정
create policy "review_images insert self" on public.review_images
for insert with check (
exists (select 1 from public.reviews rv where rv.id = review_images.review_id and rv.user_id = auth.uid())
);
create policy "review_tags insert self" on public.review_tags
for insert with check (
exists (select 1 from public.reviews rv where rv.id = review_tags.review_id and rv.user_id = auth.uid())
);

-- 즐겨찾기, 최근 본 가게: 본인만
create policy "favorites self rw" on public.favorites
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recent_views self rw" on public.recent_views
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "profiles insert self" on public.profiles
for insert with check (id = auth.uid());

-- 1) RLS 활성화(이미 켜져 있다면 생략 가능)
alter table restaurants enable row level security;

-- 2) 자신이 만든 맛집만 조회 가능
create policy "select own restaurants"
on restaurants
for select
using (created_by = auth.uid());

-- 3) 자신이 만든 맛집만 수정 가능
create policy "update own restaurants"
on restaurants
for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- 4) 자신이 만든 맛집만 삭제 가능
create policy "delete own restaurants"
on restaurants
for delete
using (created_by = auth.uid());

-- 5) 자신의 사용자 ID를 created_by로 넣는 경우에만 새 맛집 등록 허용
create policy "insert own restaurants"
on restaurants
for insert
with check (created_by = auth.uid());

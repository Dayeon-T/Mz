-- ===========================================================
-- 🍱 레스토랑 카테고리 추가 SQL
-- ===========================================================

-- 1. 기본 카테고리들을 추가
INSERT INTO public.categories (name) VALUES 
('한식'),
('중식'),
('일식'),
('양식'),
('분식'),
('치킨'),
('피자'),
('햄버거'),
('카페'),
('디저트'),
('술집'),
('바베큐'),
('해산물'),
('국물요리'),
('고기요리')
ON CONFLICT (name) DO NOTHING;


-- 3. 특정 레스토랑에 수동으로 카테고리 추가하는 예시
-- (restaurant_id는 실제 ID로 변경 필요)

-- 예시: 특정 레스토랑을 한식과 카페로 분류
INSERT INTO public.restaurant_categories (restaurant_id, category_id)
VALUES 
     ('361dbba5-9caf-4b02-82f7-4a1e68b9c1b2', (SELECT id FROM public.categories WHERE name = '한식')),
     ('a7949661-c15a-4e12-b23f-84c5e8252323', (SELECT id FROM public.categories WHERE name = '한식')),
     ('3bb5d40a-873b-43fa-83db-0edf812ea145', (SELECT id FROM public.categories WHERE name = '카페'))
ON CONFLICT (restaurant_id, category_id) DO NOTHING;


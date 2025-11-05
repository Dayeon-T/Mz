-- 먼저 카테고리 데이터가 있는지 확인
SELECT * FROM categories;

-- 카테고리가 없다면 추가
INSERT INTO categories (name) VALUES 
('한식'),
('중식'), 
('일식'),
('양식'),
('카페'),
('버블티'),
('감자탕'),
('김밥'),
('분식'),
('치킨')
ON CONFLICT (name) DO NOTHING;

-- 레스토랑 ID 확인 (실제 ID를 사용해야 함)
SELECT id, name FROM restaurants;

-- 레스토랑-카테고리 연결 데이터 추가 (실제 레스토랑 ID로 수정 필요)
-- 아마스빈 버블티 -> 카페, 버블티
INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES
('3bb5d40a-873b-43fa-83db-0edf812ea145', (SELECT id FROM categories WHERE name = '카페')),
('3bb5d40a-873b-43fa-83db-0edf812ea145', (SELECT id FROM categories WHERE name = '버블티'));

-- 맛나감자탕 -> 한식, 감자탕  
INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES
('361dbba5-9caf-4b02-82f7-4a1e68b9c1b2', (SELECT id FROM categories WHERE name = '한식')),
('361dbba5-9caf-4b02-82f7-4a1e68b9c1b2', (SELECT id FROM categories WHERE name = '감자탕'));

-- 김밥천국 -> 한식, 김밥, 분식
INSERT INTO restaurant_categories (restaurant_id, category_id) VALUES
('a7949661-c15a-4e12-b23f-84c5e8252323', (SELECT id FROM categories WHERE name = '한식')),
('a7949661-c15a-4e12-b23f-84c5e8252323', (SELECT id FROM categories WHERE name = '김밥')),
('a7949661-c15a-4e12-b23f-84c5e8252323', (SELECT id FROM categories WHERE name = '분식'));

-- 결과 확인
SELECT 
  r.name as restaurant_name,
  c.name as category_name
FROM restaurants r
JOIN restaurant_categories rc ON r.id = rc.restaurant_id  
JOIN categories c ON rc.category_id = c.id
ORDER BY r.name;
-- restaurant_categories 테이블에 외래키 제약조건 추가
ALTER TABLE public.restaurant_categories 
ADD CONSTRAINT fk_restaurant_categories_restaurant_id 
FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- 데이터 확인 쿼리들
SELECT COUNT(*) as restaurant_count FROM restaurants;
SELECT COUNT(*) as category_count FROM categories;  
SELECT COUNT(*) as restaurant_category_count FROM restaurant_categories;

-- 샘플 데이터 확인
SELECT * FROM restaurants LIMIT 3;
SELECT * FROM categories LIMIT 10;
SELECT * FROM restaurant_categories LIMIT 10;

-- 조인 테스트
SELECT 
  r.name as restaurant_name,
  c.name as category_name
FROM restaurants r
JOIN restaurant_categories rc ON r.id = rc.restaurant_id  
JOIN categories c ON rc.category_id = c.id
LIMIT 10;
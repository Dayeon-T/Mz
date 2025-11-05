-- 아마스빈 버블티에 더미 리뷰 추가
-- 먼저 restaurants 테이블에서 아마스빈 ID 확인하고, 사용자 ID 확인 후 실행

-- 1단계: 아마스빈 가게 ID와 사용자 ID 확인
-- SELECT id, name FROM public.restaurants WHERE name LIKE '%아마스빈%';
-- SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 3;

-- 2단계: 아래 SQL에서 restaurant_id와 user_id를 실제 값으로 변경 후 실행

INSERT INTO public.reviews (
  id,
  restaurant_id,
  user_id,
  rating,
  visit_date,
  text_content,
  created_at
) VALUES (
  gen_random_uuid(),
  '여기에_아마스빈_가게_ID_입력'::uuid,  -- 1단계에서 확인한 아마스빈 ID
  '여기에_사용자_ID_입력'::uuid,        -- 1단계에서 확인한 사용자 ID
  5,                                    -- 5점 만점
  '2024-11-04',                        -- 어제 방문했다고 가정
  '버블티가 정말 맛있어요! 쫄깃한 타피오카 펄이 일품이고, 다양한 맛 중에 타로 맛이 특히 추천합니다. 가게도 깔끔하고 직원분들도 친절해요. 다음에 또 올 예정입니다! 👍🧋'
);

-- 3단계: 리뷰에 태그 추가 (선택사항)
INSERT INTO public.review_tags (
  review_id,
  tag
) VALUES 
  ((SELECT id FROM public.reviews WHERE text_content LIKE '%버블티가 정말 맛있어요%' LIMIT 1), 'tasty'),
  ((SELECT id FROM public.reviews WHERE text_content LIKE '%버블티가 정말 맛있어요%' LIMIT 1), 'clean'),
  ((SELECT id FROM public.reviews WHERE text_content LIKE '%버블티가 정말 맛있어요%' LIMIT 1), 'kind');
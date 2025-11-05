-- 아마스빈에 더미 리뷰 추가 (한 번에 실행 가능한 버전)
-- 이 SQL은 가게명과 이메일로 자동으로 ID를 찾아서 리뷰를 추가합니다

DO $$
DECLARE
    restaurant_uuid uuid;
    user_uuid uuid;
    review_uuid uuid;
BEGIN
    -- 아마스빈 가게 ID 찾기
    SELECT id INTO restaurant_uuid 
    FROM public.restaurants 
    WHERE name LIKE '%아마스빈%' 
    LIMIT 1;
    
    -- 첫 번째 사용자 ID 찾기 (가장 최근 가입자)
    SELECT id INTO user_uuid 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 가게와 사용자가 모두 존재하는 경우에만 리뷰 추가
    IF restaurant_uuid IS NOT NULL AND user_uuid IS NOT NULL THEN
        -- 리뷰 추가
        INSERT INTO public.reviews (
            id,
            restaurant_id,
            user_id,
            rating,
            visit_date,
            text_content
        ) VALUES (
            gen_random_uuid(),
            restaurant_uuid,
            user_uuid,
            5,
            CURRENT_DATE - INTERVAL '1 day', -- 어제 방문
            '버블티가 정말 맛있어요! 쫄깃한 타피오카 펄이 일품이고, 다양한 맛 중에 타로 맛이 특히 추천합니다. 가게도 깔끔하고 직원분들도 친절해요. 다음에 또 올 예정입니다! 👍🧋'
        ) RETURNING id INTO review_uuid;
        
        -- 리뷰 태그 추가
        INSERT INTO public.review_tags (review_id, tag) VALUES 
            (review_uuid, 'tasty'),
            (review_uuid, 'clean'),
            (review_uuid, 'kind');
            
        RAISE NOTICE '리뷰가 성공적으로 추가되었습니다! 가게 ID: %, 사용자 ID: %, 리뷰 ID: %', restaurant_uuid, user_uuid, review_uuid;
    ELSE
        RAISE NOTICE '가게 또는 사용자를 찾을 수 없습니다. 가게 ID: %, 사용자 ID: %', restaurant_uuid, user_uuid;
    END IF;
END $$;
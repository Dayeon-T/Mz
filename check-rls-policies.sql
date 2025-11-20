-- RLS 정책 확인 및 수정

-- 1. 현재 RLS 정책 상태 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'restaurants';

-- 2. 만약 정책이 없거나 문제가 있다면 다시 생성
DROP POLICY IF EXISTS "read all restaurants" ON public.restaurants;

CREATE POLICY "read all restaurants" 
ON public.restaurants 
FOR SELECT 
USING (true);

-- 3. profiles 테이블의 RLS 정책도 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. profiles 읽기 정책 추가 (모든 사용자가 다른 사용자 프로필을 볼 수 있도록)
DROP POLICY IF EXISTS "profiles public read" ON public.profiles;

CREATE POLICY "profiles public read" 
ON public.profiles 
FOR SELECT 
USING (true);
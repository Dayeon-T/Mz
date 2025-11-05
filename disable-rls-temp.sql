-- 임시로 RLS 비활성화 (테스트용)
-- 주의: 실제 운영환경에서는 사용하지 마세요!

ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
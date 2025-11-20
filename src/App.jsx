import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import { Routes, Route, Navigate } from "react-router-dom";

// 코드 스플리팅: 페이지별 lazy import로 초기 로딩 개선
const Log = lazy(() => import("./pages/Log"));
const Home = lazy(() => import("./pages/Home"));
const Signin = lazy(() => import("./pages/Signin"));
const SearchResult = lazy(() => import("./pages/SearchResult"));
const StoreDetail = lazy(() => import("./pages/StoreDetail"));
const ReviewForm = lazy(() => import("./pages/ReviewForm"));
const MyPage = lazy(() => import("./pages/MyPage"));

// 로딩 화면 컴포넌트
const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-primary">
    <p className="text-lg text-white">페이지를 불러오는 중...</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("App: 인증 상태 변화:", event, session?.user?.id);
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingFallback />;
  }

  // 라우팅: 로그인 상태에 따라 홈/검색 접근 제어(필요시 검색은 비로그인도 허용 가능)
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Log />} />
        <Route
          path="/search"
          element={user ? <SearchResult /> : <Navigate to="/" replace />}
        />
        <Route
          path="/store/:id"
          element={user ? <StoreDetail /> : <Navigate to="/" replace />}
        />
        <Route
          path="/store/:id/review"
          element={user ? <ReviewForm /> : <Navigate to="/" replace />}
        />
        <Route
          path="/mypage"
          element={user ? <MyPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Log from "./pages/Log";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import SearchResult from "./pages/SearchResult";
import StoreDetail from "./pages/StoreDetail";
import ReviewForm from "./pages/ReviewForm";
import MyPage from "./pages/MyPage"; // 상단 import 추가
import { Routes, Route, Navigate } from "react-router-dom";

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
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <p>로딩중...</p>
      </div>
    );
  }

  // 라우팅: 로그인 상태에 따라 홈/검색 접근 제어(필요시 검색은 비로그인도 허용 가능)
  return (
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
  );
}

export default App;

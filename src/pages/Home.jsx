import { useState, useEffect, useMemo, useCallback } from "react";
import MzSvg from "../assets/mz맛집.svg?react";
import UserProfile from "../components/UserProfile.jsx";
import { Card, Container } from "../components/Card.jsx";
import KakaoMap from "../components/KakaoMap.jsx";
import Signin from "./Signin.jsx";
import { fetchRestaurantsWithData } from "../api/restaurants";
import SearchBar from "../components/SearchBar.jsx";
import { useNavigate, Link } from "react-router-dom";
import { signOut as signOutApi } from "../api/auth";
import Addmz from "../assets/addMz.svg?react";
import ModalBlur from "../components/ModalBlur.jsx";
import AddmzModal from "../modals/AddmzModal.jsx";
import { supabase } from "../lib/supabase";
import { getProfileById } from "../api/profiles";
import { geocodeAddress } from "../lib/kakaoGeocoder";
import toast from "react-hot-toast";

export default function Home() {
  const navigate = useNavigate();
  const [showSignin, setShowSignin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [focusedRestaurantId, setFocusedRestaurantId] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapRadius, setMapRadius] = useState(5000);

  const loadRestaurants = useCallback(async () => {
    try {
      const data = await fetchRestaurantsWithData();
      setRestaurants(data);
    } catch (err) {
      console.error("맛집 목록 로드 실패:", err);
      toast.error("맛집 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleLoginClick = () => {
    setShowSignin(true);
  };

  const handleBackToHome = () => {
    setShowSignin(false);
  };

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => {
      const inName = r.name?.toLowerCase().includes(q);
      const inAddr = r.address?.toLowerCase().includes(q);
      const inCat =
        Array.isArray(r.categories) &&
        r.categories.some((c) => c?.toLowerCase().includes(q));
      return inName || inAddr || inCat;
    });
  }, [restaurants, query]);

  // StoreList는 간단 목록을 원함
  const basicList = useMemo(() => {
    const sorted = [...filteredRestaurants].sort((a, b) => {
      const ratingA = typeof a.rating === "number" ? a.rating : 0;
      const ratingB = typeof b.rating === "number" ? b.rating : 0;
      if (ratingA !== ratingB) return ratingB - ratingA;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
    return sorted.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
    }));
  }, [filteredRestaurants]);

  useEffect(() => {
    if (
      focusedRestaurantId &&
      !filteredRestaurants.some((r) => r.id === focusedRestaurantId)
    ) {
      setFocusedRestaurantId(null);
    }
  }, [filteredRestaurants, focusedRestaurantId]);

  useEffect(() => {
    const loadProfileCenter = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;
        const profile = await getProfileById(user.id);
        const address = profile?.address?.trim();
        if (!address) return;
        const coords = await geocodeAddress(address);
        setMapCenter(coords);
      } catch (err) {
        console.error("사용자 위치 변환 실패:", err);
      }
    };

    loadProfileCenter();
  }, []);

  if (showSignin) {
    return <Signin onBackToHome={handleBackToHome} />;
  }
  const handleSignOut = async () => {
    try {
      await signOutApi();
      // 즉시 로그인 화면으로 전환 (App의 인증 상태 갱신과 무관하게 빠른 피드백)
      setShowSignin(true);
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  const handleRestaurantSaved = useCallback(async () => {
    await loadRestaurants();
    setShowAddModal(false);
  }, [loadRestaurants]);

  return (
    // 1. 최상위 div에서 화면 높이 고정 및 레이아웃 설정
    <div className="h-screen overflow-hidden flex flex-col">
      <button
        onClick={handleSignOut}
        className="text-[16px] text-gray underline mt-[8px] text-left w-fit absolute right-4 top-4 hover:text-white"
      >
        로그아웃
      </button>
      {/* 2. Container가 남은 공간을 모두 채우도록 설정 */}
      <Container className="flex-grow flex flex-col">
        {/* 헤더 부분 (높이 고정) */}
        <div className="flex-shrink-0 flex">
          <div className="w-[418px] pr-[197px]">
            <Link to="/" aria-label="홈으로 이동">
              <MzSvg className="cursor-pointer" />
            </Link>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={(q) => {
              if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
          />
        </div>

        {/* 3. 메인 콘텐츠 영역이 남은 공간을 모두 채우도록 설정 */}
        <div className="flex-grow flex mt-4 min-h-0">
          {/* 왼쪽 사이드바 (높이 고정, 내부 스크롤) */}
          <div className="flex-shrink-0 w-[418px] flex flex-col">
            <UserProfile onLoginClick={handleLoginClick} />
            {/* Card가 남은 공간을 채우고 내부 스크롤 */}
            <div className="flex-grow mt-[40px] min-h-0">
              <Card
                className="h-full"
                restaurants={basicList}
                onSelectRestaurant={setFocusedRestaurantId}
                activeRestaurantId={focusedRestaurantId}
              />
            </div>
          </div>

          {/* 4. 지도 영역이 남은 공간을 모두 채우도록 설정 (h-screen 제거) */}
          <div className="relative ml-8 w-full rounded-tl-[40px] overflow-hidden">
            <KakaoMap
              restaurants={filteredRestaurants}
              activeRestaurantId={focusedRestaurantId}
              focusCenter={mapCenter}
              focusRadius={mapCenter ? mapRadius : null}
            />

            <div
              className="absolute bottom-12 right-12 p-4 w-16 h-16 rounded-full flex items-center justify-center text-white bg-sub z-40 shadow-lg cursor-pointer hover:bg-red-500 transition-colors"
              onClick={() => setShowAddModal(true)}
              aria-label="맛집 등록 모달 열기"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowAddModal(true);
              }}
            >
              <Addmz />
            </div>
          </div>
        </div>
      </Container>
      {showAddModal && (
        <AddmzModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleRestaurantSaved}
        />
      )}
    </div>
  );
}

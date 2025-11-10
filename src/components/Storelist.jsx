import { useState, useEffect } from "react";
import { listRestaurantsBasic } from "../api/restaurants";
import Minmark from "../assets/minmark.svg?react";

export default function StoreList({
  restaurants: externalRestaurants,
  onSelectRestaurant,
  activeRestaurantId,
}) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 외부에서 리스트가 주어지면 자체 로딩은 생략하고 표시만 함
    if (Array.isArray(externalRestaurants)) {
      setRestaurants(externalRestaurants);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const fetchRestaurants = async () => {
      try {
        console.log("StoreList: 가게 목록 로드 시작...");
        const data = await listRestaurantsBasic();
        if (mounted) {
          setRestaurants(data || []);
          console.log(
            "StoreList: 가게 목록 설정 완료:",
            data?.length || 0,
            "개"
          );
        }
      } catch (err) {
        console.error("가게 목록 로드 오류:", err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          console.log("StoreList: 로딩 완료");
          setLoading(false);
        }
      }
    };

    fetchRestaurants();

    return () => {
      mounted = false;
    };
  }, [externalRestaurants]);

  if (loading) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-gray-500">가게 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-red-500">가게 목록을 불러올 수 없습니다: {error}</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-gray-500">등록된 가게가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="pt-[40px] pl-[24px] pr-6">
      {restaurants.map((restaurant) => {
        const isActive = activeRestaurantId === restaurant.id;
        return (
          <button
            key={restaurant.id}
            type="button"
            onClick={() => onSelectRestaurant?.(restaurant.id)}
            className={`w-full text-left flex items-center gap-[12px] mb-[30px] transition-colors cursor-pointer ${
              isActive
                ? "bg-rose-100/60 rounded-2xl py-4 px-3"
                : "hover:bg-black/5 rounded-2xl py-4 px-3"
            }`}
          >
            <Minmark />
            <div className="flex-1 min-w-0">
              <p
                className="text-black text-xl font-semibold truncate"
                title={restaurant.name}
              >
                {restaurant.name}
              </p>
              <p
                className="text-text text-sm font-medium truncate"
                title={restaurant.address}
              >
                {restaurant.address}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

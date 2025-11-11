import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import MzSvg from "../assets/mz맛집.svg?react";
import SearchResultSearchBar from "../components/SearchResultSearchBar.jsx";
import { fetchRestaurantsWithData } from "../api/restaurants";
import StoreGridList from "../components/StoreGridList.jsx";

export default function SearchResult() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qParam = params.get("q") || "";

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchRestaurantsWithData();
        if (mounted) setRestaurants(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = qParam.trim().toLowerCase();
    if (!q) return [];
    return restaurants.filter((r) => {
      const inName = r.name?.toLowerCase().includes(q);
      const inAddr = r.address?.toLowerCase().includes(q);
      const inCat =
        Array.isArray(r.categories) &&
        r.categories.some((c) => c?.toLowerCase().includes(q));
      return inName || inAddr || inCat;
    });
  }, [restaurants, qParam]);

  const basicList = useMemo(
    () => filtered.map((r) => ({ id: r.id, name: r.name, address: r.address })),
    [filtered]
  );

  return (
    <div className="px-10 pt-10">
      <div className="flex">
        <div className="w-[418px] pr-[197px]">
          <Link to="/" aria-label="홈으로 이동">
            <MzSvg className="cursor-pointer" />
          </Link>
        </div>
        <SearchResultSearchBar
          value={qParam}
          onSubmit={(q) => q && navigate(`/search?q=${encodeURIComponent(q)}`)}
        />
      </div>

      <div className="w-full min-h-screen bg-white mt-10 rounded-t-[38px] grid grid-cols-3 gap-20 pt-20 px-20 pb-20">
        <StoreGridList stores={filtered} />
      </div>
    </div>
  );
}

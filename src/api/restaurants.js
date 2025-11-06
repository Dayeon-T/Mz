import { supabase } from "../lib/supabase";

// KST(Asia/Seoul) 시각 기준으로 영업중 여부 계산 (DB 함수 is_open_now와 동일 로직)
function parseTimeToMinutes(t) {
  if (!t) return null;
  // t 예: "12:30:00" 또는 "08:00:00"
  const [hh = 0, mm = 0, ss = 0] = String(t)
    .split(":")
    .map((n) => parseInt(n, 10) || 0);
  return hh * 60 + mm + Math.floor(ss / 60);
}

function isOpenNow(open, close, breakStart, breakEnd, now = new Date()) {
  // Asia/Seoul 타임존의 시:분을 구해 분 단위로 변환
  let tKSTMin;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const mm = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10
    );
    tKSTMin = hh * 60 + mm;
  } catch {
    // Intl이 실패하는 환경 대비: UTC+9로 근사
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    tKSTMin = (minutes + 9 * 60) % (24 * 60);
  }

  const o = parseTimeToMinutes(open);
  const c = parseTimeToMinutes(close);
  const bs = parseTimeToMinutes(breakStart);
  const be = parseTimeToMinutes(breakEnd);

  if (o == null || c == null) return false;

  const inRange = (start, end, t) => {
    if (start <= end) {
      return t >= start && t < end;
    }
    // 자정을 넘기는 구간
    return t >= start || t < end;
  };

  // 영업시간 범위 체크
  if (!inRange(o, c, tKSTMin)) return false;

  // 브레이크타임 배제
  if (bs != null && be != null) {
    if (inRange(bs, be, tKSTMin)) return false;
  }

  return true;
}

// 카테고리/리뷰/이미지까지 조합된 레스토랑 리스트
export async function fetchRestaurantsWithData() {
  try {
    const { data: restaurants, error } = await supabase.from("restaurants")
      .select(`
        id, name, address, lat, lng,
        open_time, close_time, break_start, break_end,
        restaurant_categories:restaurant_categories(
          categories:categories!restaurant_categories_category_id_fkey(name)
        )
      `);

    if (error) throw error;
    if (!restaurants || restaurants.length === 0) return [];

    const ids = restaurants.map((r) => r.id);

    // 리뷰 모음
    const { data: reviews } = await supabase
      .from("reviews")
      .select("restaurant_id, rating")
      .in("restaurant_id", ids);

    // 이미지 URL 컬럼명 탐색(샘플 1건으로 컬럼 파악 후 필요한 컬럼만 조회)
    let urlColumn = null;
    let hasSortOrder = false;
    try {
      const { data: sample } = await supabase
        .from("restaurant_images")
        .select("*")
        .limit(1);
      if (sample && sample.length > 0) {
        const columns = Object.keys(sample[0]);
        urlColumn =
          columns.find(
            (c) => c.includes("url") || c.includes("path") || c.includes("src")
          ) || null;
        hasSortOrder = columns.includes("sort_order");
      }
    } catch {}

    let images = [];
    if (urlColumn) {
      const selectCols = `restaurant_id, ${urlColumn}${
        hasSortOrder ? ", sort_order" : ""
      }`;
      const q = supabase
        .from("restaurant_images")
        .select(selectCols)
        .in("restaurant_id", ids);
      const { data: imgData } = hasSortOrder
        ? await q.order("sort_order", { ascending: true })
        : await q;
      images = imgData || [];
    }

    const imagesByRestaurant = new Map();
    (images || []).forEach((img) => {
      if (!imagesByRestaurant.has(img.restaurant_id)) {
        imagesByRestaurant.set(img.restaurant_id, []);
      }
      imagesByRestaurant.get(img.restaurant_id).push(img);
    });

    const reviewsByRestaurant = new Map();
    (reviews || []).forEach((rv) => {
      if (!reviewsByRestaurant.has(rv.restaurant_id)) {
        reviewsByRestaurant.set(rv.restaurant_id, []);
      }
      reviewsByRestaurant.get(rv.restaurant_id).push(rv.rating);
    });

    return restaurants.map((r) => {
      const ratings = reviewsByRestaurant.get(r.id) || [];
      const avg = ratings.length
        ? Number(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          )
        : 4.0;

      const categories =
        r.restaurant_categories
          ?.map((rc) => rc.categories?.name)
          .filter(Boolean) || [];

      const firstImageObj = imagesByRestaurant.get(r.id)?.[0];
      const firstImage = firstImageObj
        ? firstImageObj.url ||
          firstImageObj.image_url ||
          firstImageObj.src ||
          firstImageObj.image_path ||
          null
        : null;

      const is_open = isOpenNow(
        r.open_time,
        r.close_time,
        r.break_start,
        r.break_end
      );

      return {
        id: r.id,
        name: r.name,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        rating: avg,
        categories,
        image: firstImage,
        is_open,
      };
    });
  } catch {
    // fallback: 기본 컬럼만
    const { data: basic } = await supabase
      .from("restaurants")
      .select(
        "id, name, address, lat, lng, open_time, close_time, break_start, break_end"
      );
    return (basic || []).map((r) => ({
      ...r,
      rating: 4.0,
      categories: [],
      image: null,
      is_open: isOpenNow(r.open_time, r.close_time, r.break_start, r.break_end),
    }));
  }
}

// 간단한 레스토랑 목록
export async function listRestaurantsBasic() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, address")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

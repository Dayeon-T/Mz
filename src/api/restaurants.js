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
export async function fetchRestaurantsWithData(restaurantIds) {
  try {
    let query = supabase.from("restaurants").select(`
        id, name, address, lat, lng, created_at, phone,
        created_by, tagline, extra_note, marker_emoji,
        open_time, close_time, break_start, break_end,
        has_takeout, has_delivery, has_reservation, has_parking, has_wifi,
        restaurant_categories:restaurant_categories(
          categories:categories!restaurant_categories_category_id_fkey(name)
        )
      `);

    if (Array.isArray(restaurantIds) && restaurantIds.length > 0) {
      query = query.in("id", restaurantIds);
    }

    const { data: restaurants, error } = await query;

    if (error) throw error;
    if (!restaurants || restaurants.length === 0) return [];

    const ids = restaurants.map((r) => r.id);
    if (ids.length === 0) return [];

    const creatorIds = Array.from(
      new Set(
        restaurants
          .map((r) => r.created_by)
          .filter((val) => typeof val === "string" && val.length > 0)
      )
    );

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

    let reviewDetails = [];
    try {
      const { data: detailed } = await supabase
        .from("reviews")
        .select(
          `id, restaurant_id, rating, text_content, created_at, visit_date,
           user:profiles!reviews_user_id_fkey(nickname, avatar_url),
           review_images:review_images(url, sort_order)`
        )
        .in("restaurant_id", ids)
        .order("created_at", { ascending: false });
      reviewDetails = detailed || [];
    } catch {}

    const creatorProfilesMap = new Map();
    if (creatorIds.length > 0) {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, nickname, avatar_url")
          .in("id", creatorIds);
        (profilesData || []).forEach((profile) => {
          creatorProfilesMap.set(profile.id, profile);
        });
      } catch {}
    }

    const reviewsByRestaurant = new Map();
    (reviews || []).forEach((rv) => {
      if (!reviewsByRestaurant.has(rv.restaurant_id)) {
        reviewsByRestaurant.set(rv.restaurant_id, []);
      }
      reviewsByRestaurant.get(rv.restaurant_id).push(rv.rating);
    });

    const reviewDetailsByRestaurant = new Map();
    const reviewPhotosByRestaurant = new Map();
    const parseOrder = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    reviewDetails.forEach((rev) => {
      const normalizedImages = Array.isArray(rev.review_images)
        ? [...rev.review_images]
            .sort((a, b) => {
              const aOrder = parseOrder(a?.sort_order);
              const bOrder = parseOrder(b?.sort_order);
              return aOrder - bOrder;
            })
            .map((img) => img?.url)
            .filter(Boolean)
        : [];

      const normalizedReview = {
        id: rev.id,
        restaurant_id: rev.restaurant_id,
        rating: rev.rating,
        text: rev.text_content || "",
        created_at: rev.created_at || null,
        visit_date: rev.visit_date || null,
        author: {
          nickname: rev?.user?.nickname || null,
          avatar_url: rev?.user?.avatar_url || null,
        },
        images: normalizedImages,
      };

      if (!reviewDetailsByRestaurant.has(rev.restaurant_id)) {
        reviewDetailsByRestaurant.set(rev.restaurant_id, []);
      }
      reviewDetailsByRestaurant.get(rev.restaurant_id).push(normalizedReview);

      if (!reviewPhotosByRestaurant.has(rev.restaurant_id)) {
        reviewPhotosByRestaurant.set(rev.restaurant_id, []);
      }
      reviewPhotosByRestaurant.get(rev.restaurant_id).push(...normalizedImages);
    });

    return restaurants.map((r) => {
      const ratings = reviewsByRestaurant.get(r.id) || [];
      const avg = ratings.length
        ? Number(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          )
        : 0;

      const categories =
        r.restaurant_categories
          ?.map((rc) => rc.categories?.name)
          .filter(Boolean) || [];

      const imageListRaw = imagesByRestaurant.get(r.id) || [];
      const imageUrls = imageListRaw
        .map(
          (img) => img.url || img.image_url || img.src || img.image_path || null
        )
        .filter(Boolean);
      const firstImage = imageUrls[0] || null;

      const is_open = isOpenNow(
        r.open_time,
        r.close_time,
        r.break_start,
        r.break_end
      );

      const creatorProfile = creatorProfilesMap.get(r.created_by) || null;

      const detailedReviews = reviewDetailsByRestaurant.get(r.id) || [];
      const reviewPhotos = (reviewPhotosByRestaurant.get(r.id) || []).filter(
        Boolean
      );
      const reviewPhotosPreview = reviewPhotos.slice(0, 4);

      return {
        id: r.id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        lat: r.lat,
        lng: r.lng,
        rating: avg,
        review_count: ratings.length,
        categories,
        image: firstImage,
        images: imageUrls,
        created_at: r.created_at,
        is_open,
        tagline: r.tagline || null,
        extra_note: r.extra_note || null,
        marker_emoji: r.marker_emoji || null,
        created_by: r.created_by || null,
        recommended_by: creatorProfile,
        reviews: detailedReviews,
        review_photos: reviewPhotosPreview,
        has_delivery: r.has_delivery,
        has_reservation: r.has_reservation,
        has_parking: r.has_parking,
        has_wifi: r.has_wifi,
        has_takeout: r.has_takeout,
      };
    });
  } catch {
    // fallback: 기본 컬럼만
    let fallbackQuery = supabase
      .from("restaurants")
      .select(
        "id, name, address, lat, lng, open_time, close_time, break_start, break_end, created_at, created_by, tagline, extra_note, marker_emoji, has_takeout, has_delivery, has_reservation, has_parking, has_wifi"
      );

    if (Array.isArray(restaurantIds) && restaurantIds.length > 0) {
      fallbackQuery = fallbackQuery.in("id", restaurantIds);
    }

    const { data: basic } = await fallbackQuery;
    return (basic || []).map((r) => ({
      ...r,
      rating: 0,
      review_count: 0,
      categories: [],
      image: null,
      images: [],
      created_at: r.created_at,
      is_open: isOpenNow(r.open_time, r.close_time, r.break_start, r.break_end),
      tagline: r.tagline || null,
      extra_note: r.extra_note || null,
      marker_emoji: r.marker_emoji || null,
      created_by: r.created_by || null,
      recommended_by: null,
      reviews: [],
      review_photos: [],
      has_delivery: r.has_delivery,
      has_reservation: r.has_reservation,
      has_parking: r.has_parking,
      has_wifi: r.has_wifi,
      has_takeout: r.has_takeout,
    }));
  }
}

export async function fetchRestaurantDetail(restaurantId) {
  if (!restaurantId) return null;
  const results = await fetchRestaurantsWithData([restaurantId]);
  if (!Array.isArray(results) || results.length === 0) return null;
  return results[0];
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

export async function deleteRestaurant(restaurantId) {
  if (!restaurantId) throw new Error("맛집 정보를 찾을 수 없습니다.");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", restaurantId)
    .eq("created_by", user.id);

  if (error) throw error;
}

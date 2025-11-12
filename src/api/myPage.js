import { supabase } from "../lib/supabase";
import { fetchRestaurantsWithData } from "./restaurants";

const enrichRestaurants = (orderedIds, restaurants, metaKey, metaMap) => {
  const base = new Map(restaurants.map((item) => [item.id, item]));
  return orderedIds
    .map((id) => {
      const detail = base.get(id);
      if (!detail) return null;
      if (metaKey && metaMap?.has(id)) {
        return { ...detail, [metaKey]: metaMap.get(id) };
      }
      return { ...detail };
    })
    .filter(Boolean);
};

export async function fetchMyRestaurants(userId) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const restaurantDetails = await fetchRestaurantsWithData(ids);
  const createdAtMap = new Map(
    (data ?? []).map((row) => [row.id, row.created_at])
  );

  return enrichRestaurants(ids, restaurantDetails, "created_at", createdAtMap);
}

export async function fetchFavoriteRestaurants(userId) {
  const { data, error } = await supabase
    .from("favorites")
    .select("restaurant_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const ids = (data ?? []).map((row) => row.restaurant_id);
  if (ids.length === 0) return [];

  const restaurantDetails = await fetchRestaurantsWithData(ids);
  const favoritedAtMap = new Map(
    (data ?? []).map((row) => [row.restaurant_id, row.created_at])
  );

  return enrichRestaurants(
    ids,
    restaurantDetails,
    "favorited_at",
    favoritedAtMap
  );
}

export async function fetchRecentRestaurants(userId, limit = 20) {
  const { data, error } = await supabase
    .from("recent_views")
    .select("restaurant_id, viewed_at")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit * 3);

  if (error) throw error;

  const deduped = [];
  const seen = new Set();
  const viewedAtMap = new Map();

  for (const row of data ?? []) {
    const id = row.restaurant_id;
    if (!id) continue;
    if (!seen.has(id)) {
      deduped.push(id);
      seen.add(id);
    }
    if (!viewedAtMap.has(id)) viewedAtMap.set(id, row.viewed_at);
    if (deduped.length >= limit) break;
  }

  if (deduped.length === 0) return [];

  const restaurantDetails = await fetchRestaurantsWithData(deduped);
  return enrichRestaurants(
    deduped,
    restaurantDetails,
    "viewed_at",
    viewedAtMap
  );
}

export async function fetchMyReviews(userId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, restaurant_id, rating, text_content, visit_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const reviews = data ?? [];
  if (reviews.length === 0) return [];

  const restaurantIds = Array.from(
    new Set(reviews.map((row) => row.restaurant_id).filter(Boolean))
  );
  let restaurantMap = new Map();
  if (restaurantIds.length > 0) {
    const details = await fetchRestaurantsWithData(restaurantIds);
    restaurantMap = new Map(details.map((item) => [item.id, item]));
  }

  const reviewIds = reviews.map((row) => row.id);
  let imagesByReview = new Map();
  if (reviewIds.length > 0) {
    const { data: imageRows } = await supabase
      .from("review_images")
      .select("id, review_id, url, sort_order")
      .in("review_id", reviewIds)
      .order("sort_order", { ascending: true });

    imagesByReview = new Map();
    (imageRows || []).forEach(({ id, review_id, url, sort_order }) => {
      if (!imagesByReview.has(review_id)) imagesByReview.set(review_id, []);
      imagesByReview.get(review_id).push({ id, url, sort_order });
    });
  }

  return reviews.map((row) => ({
    id: row.id,
    restaurant_id: row.restaurant_id,
    rating: row.rating,
    text: row.text_content,
    visit_date: row.visit_date,
    created_at: row.created_at,
    restaurant: restaurantMap.get(row.restaurant_id) ?? null,
    images: (imagesByReview.get(row.id) ?? []).filter((img) => img?.url),
  }));
}

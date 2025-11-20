import { supabase } from "../lib/supabase";

export async function listFavorites() {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("favorites")
    .select("restaurant_id, created_at")
    .eq("user_id", user.id);
  if (error) throw error;
  return data ?? [];
}

export async function isFavorite(restaurantId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return false;

  const { data } = await supabase
    .from("favorites")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  return !!data;
}

export async function toggleFavorite(restaurantId) {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("favorites")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const { error: delErr } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId);
    if (delErr) throw delErr;
    return false;
  }

  const { error: insErr } = await supabase.from("favorites").insert({
    user_id: user.id,
    restaurant_id: restaurantId,
  });
  if (insErr) throw insErr;
  return true;
}

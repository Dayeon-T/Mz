import { supabase } from "../lib/supabase";

export async function recordRecentView(restaurantId) {
  if (!restaurantId) return;

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) return;

  const { error } = await supabase.from("recent_views").insert({
    user_id: user.id,
    restaurant_id: restaurantId,
    viewed_at: new Date().toISOString(),
  });

  if (error) throw error;
}

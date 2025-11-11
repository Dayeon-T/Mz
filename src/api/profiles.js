import { supabase } from "../lib/supabase";

export async function isEmailAvailable(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function isNicknameAvailable(nickname) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("nickname", nickname.trim())
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function isAddressAvailable(address) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("address", address)
    .maybeSingle();
  if (error) throw error;
  return !data;
}
export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const payload = { ...updates };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 닉네임입니다.");
    }
    throw error;
  }
  return data;
}

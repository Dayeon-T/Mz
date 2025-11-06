import { supabase } from "../lib/supabase"

export async function isEmailAvailable(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle()
  if (error) throw error
  return !data
}

export async function isNicknameAvailable(nickname) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("nickname", nickname.trim())
    .maybeSingle()
  if (error) throw error
  return !data
}

export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) throw error
  return data
}

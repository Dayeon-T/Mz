import { supabase } from "../lib/supabase";

export async function signUp({email, password, nickname}){
    // 닉네임 중복체크
    const {data:nickTaken, error:nickErr} = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", nickname)
        .maybeSingle();
    
    if (nickErr) throw nickErr;
    if (nickTaken) throw new Error("이미 사용중인 닉네임입니다.")

    // 회원가입 진행
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        if (error.message.includes("Password should be at least 6 characters")) {
            throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
        }
        throw error;
    }

    // 프로필 생성
    if (data.user) {
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: data.user.id,
                email: email,
                nickname: nickname,
            });

        if (profileError) throw profileError;
    }

    return data;
}

export async function signIn({email, password}) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}


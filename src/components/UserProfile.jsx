import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Ping from "../assets/ping.svg?react";
import User from "../assets/user.svg?react";
import { getProfileById } from "../api/profiles";
import { signOut as signOutApi } from "../api/auth";
import { Link } from "react-router-dom"; // 이미 없다면 추가

const profileContainerStyles =
  "w-[418px] h-[141px] bg-white rounded-b-[100px] rounded-tr-[100px] mt-[16px] flex items-center";
const avatarStyles =
  "ml-[40px] w-[94px] h-[94px] bg-search-bg rounded-[100px] flex items-center justify-center";
const userInfoStyles = "ml-[20px] flex justify-center flex-col";
const usernameStyles = "text-[31px] font-bold mb-[4px]";
const handleStyles = "text-[22px] font-semibold text-[#727272]";
const locationContainerStyles = "flex items-center";
const locationTextStyles = "ml-[4px] text-[20px] text-text font-medium";
const loginContainerStyles =
  "w-full h-full flex flex-col justify-center items-center";
const loginTextStyles = "text-xl";
const linkStyles = "text-text font-semibold hover:underline cursor-pointer";

function LoggedInProfile({ user, profile }) {
  const nickname = profile?.nickname || "사용자";
  const handle = user?.email?.split("@")[0] || "";

  // 닉네임 + 핸들 전체 길이에 따라 폰트 크기 조정
  const totalLength = nickname.length + handle.length;
  let fontSize = "31px";
  let handleFontSize = "22px";

  if (totalLength > 20) {
    fontSize = "20px";
    handleFontSize = "16px";
  } else if (totalLength > 15) {
    fontSize = "24px";
    handleFontSize = "18px";
  } else if (totalLength > 12) {
    fontSize = "28px";
    handleFontSize = "20px";
  }

  return (
    <>
      <div className={avatarStyles}>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="프로필"
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <User />
        )}
      </div>
      <div className={userInfoStyles}>
        <p className="font-bold mb-[4px]" style={{ fontSize }}>
          {nickname} &nbsp;
          <span
            className="font-semibold text-[#727272]"
            style={{ fontSize: handleFontSize }}
          >
            @{handle}
          </span>
        </p>
        <div className={locationContainerStyles}>
          <Ping />
          <p className={locationTextStyles}>{profile?.address}</p>
        </div>
        <div className="mt-2">
          <Link
            to="/mypage"
            className="text-[18px] font-semibold text-text underline decoration-transparent transition-all hover:decoration-current"
          >
            마이페이지
          </Link>
        </div>
      </div>
    </>
  );
}

function LoginPrompt({ onLoginClick }) {
  return (
    <div className={loginContainerStyles}>
      <p className={loginTextStyles}>
        <span onClick={onLoginClick} className={linkStyles}>
          로그인
        </span>{" "}
        /
        <span onClick={onLoginClick} className={linkStyles}>
          회원가입
        </span>{" "}
        하고 맛집 알아보기
      </p>
    </div>
  );
}

export default function UserProfile({ onLoginClick }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("UserProfile: 인증 상태 변화:", event, session?.user?.id);

      setUser(session?.user ?? null);

      if (session?.user) {
        // 로그인 시 프로필 정보 가져오기
        try {
          const profileData = await getProfileById(session.user.id);
          if (mounted) setProfile(profileData);
        } catch (error) {
          console.error("프로필 로드 오류:", error);
          if (mounted) setProfile(null);
        }
      } else {
        // 로그아웃 시 프로필 정보 초기화
        if (mounted) setProfile(null);
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className={profileContainerStyles}>
        <div className={loginContainerStyles}>
          <p className={loginTextStyles}>로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={profileContainerStyles}>
      {user ? (
        <LoggedInProfile user={user} profile={profile} />
      ) : (
        <LoginPrompt onLoginClick={onLoginClick} />
      )}
    </div>
  );
}

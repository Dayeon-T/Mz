import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import MzSvg from "../assets/mz맛집.svg?react";
import UserIcon from "../assets/user.svg?react";
import { supabase } from "../lib/supabase";
import { getProfileById, updateProfile } from "../api/profiles";
import {
  fetchFavoriteRestaurants,
  fetchMyRestaurants,
  fetchMyReviews,
  fetchRecentRestaurants,
} from "../api/myPage";
import { deleteRestaurant } from "../api/restaurants";
import { signOut as signOutApi } from "../api/auth";
import { updateReview, deleteReview } from "../api/reviews";

const MENU_ITEMS = [
  { key: "recent", label: "최근 본 가게" },
  { key: "favorites", label: "즐겨찾기" },
  { key: "reviews", label: "내가 쓴 리뷰" },
  { key: "myRestaurants", label: "내가 등록한 맛집" },
];

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
};

const clamp5 = (value) =>
  Math.max(1, Math.min(5, Math.round(Number(value) || 0)));

function StarRating({ rating = 0, size = "text-xl" }) {
  const safe = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const filled = Math.round(safe);
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`별점 ${safe.toFixed(1)}점`}
    >
      {Array.from({ length: 5 }).map((_, idx) => (
        <span
          key={idx}
          className={`${size} ${
            idx < filled ? "text-red-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingSelector({ value = 0, onChange }) {
  const current = clamp5(value);
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`별점 ${current}점 선택`}
    >
      {Array.from({ length: 5 }).map((_, idx) => {
        const score = idx + 1;
        const active = score <= current;
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange?.(score)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${score}점으로 설정`}
          >
            <span
              className={`text-3xl ${
                active ? "text-red-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RestaurantCard({
  restaurant,
  metaLabel,
  canManage,
  onDelete,
  deleting,
}) {
  const image =
    restaurant?.image ||
    (Array.isArray(restaurant?.images) && restaurant.images.length > 0
      ? restaurant.images[0]
      : null);
  const categories = Array.isArray(restaurant?.categories)
    ? restaurant.categories.filter(Boolean)
    : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-[30px] border border-rose-100 bg-white shadow-md transition-transform hover:-translate-y-1">
      <Link
        to={`/store/${restaurant.id}`}
        className="relative block aspect-[4/3] bg-gray-100"
        aria-label={`${restaurant.name} 상세보기`}
      >
        {image ? (
          <img
            src={image}
            alt={restaurant.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            이미지 없음
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            restaurant.is_open
              ? "bg-red-100 text-red-500"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {restaurant.is_open ? "영업중" : "영업 종료"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-xl font-semibold text-black">
            {restaurant.name}
          </h3>
          <p className="text-sm text-gray-500">{restaurant.address}</p>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-red-400"
              >
                #{cat}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <StarRating rating={restaurant.rating} size="text-base" />
          <span className="text-sm font-semibold text-black">
            {Number.isFinite(restaurant.rating)
              ? restaurant.rating.toFixed(1)
              : "0.0"}
          </span>
          <span className="text-xs text-gray-400">
            (
            {Number.isFinite(restaurant.review_count)
              ? restaurant.review_count
              : 0}
            )
          </span>
        </div>
        {metaLabel && <p className="text-xs text-gray-400">{metaLabel}</p>}
      </div>
      <div className="border-t border-gray-100 p-5">
        {canManage && (
          <button
            type="button"
            onClick={() => onDelete?.(restaurant)}
            disabled={deleting}
            className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "삭제" : "삭제"}
          </button>
        )}
      </div>
    </article>
  );
}

function ReviewItem({ review, onEdit, onDelete }) {
  const restaurant = review.restaurant;
  const cover =
    review.images?.[0] ||
    restaurant?.image ||
    (Array.isArray(restaurant?.images) && restaurant.images[0]) ||
    null;

  return (
    <article className="flex gap-6 border-b border-gray-100 py-6 last:border-b-0">
      <Link
        to={`/store/${review.restaurant_id}`}
        className="w-40 flex-shrink-0 overflow-hidden rounded-3xl bg-gray-100"
        aria-label={`${restaurant?.name ?? "가게"} 리뷰 보기`}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            이미지 없음
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-black">
              {restaurant?.name ?? "가게 정보 없음"}
            </h3>
            <p className="text-sm text-gray-500">{restaurant?.address}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="text-xl" />
              <span className="text-base font-semibold text-black">
                {Number.isFinite(review.rating)
                  ? review.rating.toFixed(1)
                  : "0.0"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit?.(review)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-rose-50"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(review)}
                className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          방문일 {formatDate(review.visit_date) ?? "정보 없음"}
          {review.created_at && ` · 작성일 ${formatDate(review.created_at)}`}
        </p>
        {review.text && (
          <p className="rounded-3xl bg-rose-50 px-6 py-4 text-base text-gray-700">
            {review.text}
          </p>
        )}
        {Array.isArray(review.images) && review.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {review.images.slice(0, 4).map((src, idx) => (
              <img
                key={`${review.id}-photo-${idx}`}
                src={src}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [section, setSection] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lists, setLists] = useState({
    recent: [],
    favorites: [],
    reviews: [],
    myRestaurants: [],
  });
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: "",
    avatar_url: "",
    address: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFormError, setProfileFormError] = useState("");
  const emptyReviewForm = {
    rating: 0,
    visitYear: "",
    visitMonth: "",
    visitDay: "",
    text: "",
    files: [],
  };
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState(() => ({ ...emptyReviewForm }));
  const [editingReview, setEditingReview] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewModalError, setReviewModalError] = useState("");
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!currentUser?.id) throw new Error("로그인 정보가 만료되었습니다.");

        const [profileData, myRestaurants, recent, favorites, reviews] =
          await Promise.all([
            getProfileById(currentUser.id),
            fetchMyRestaurants(currentUser.id),
            fetchRecentRestaurants(currentUser.id),
            fetchFavoriteRestaurants(currentUser.id),
            fetchMyReviews(currentUser.id),
          ]);

        if (!active) return;

        setUser(currentUser);
        setProfile(profileData);
        setLists({
          recent,
          favorites,
          reviews,
          myRestaurants,
        });
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError(err.message ?? "마이페이지 정보를 불러오지 못했습니다.");
        toast.error("마이페이지 정보를 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const refreshReviews = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updated = await fetchMyReviews(user.id);
      setLists((prev) => ({ ...prev, reviews: updated }));
    } catch (err) {
      console.error(err);
      toast.error("리뷰 목록을 다시 불러오지 못했습니다.");
    }
  }, [user?.id]);

  const openReviewModal = (review) => {
    if (!review) return;
    setReviewModalError("");
    const visit = review.visit_date ? new Date(review.visit_date) : null;
    const hasValidVisit = visit && !Number.isNaN(visit.getTime());
    setReviewForm({
      rating: clamp5(review.rating ?? 0),
      visitYear: hasValidVisit ? String(visit.getFullYear()) : "",
      visitMonth: hasValidVisit
        ? String(visit.getMonth() + 1).padStart(2, "0")
        : "",
      visitDay: hasValidVisit ? String(visit.getDate()).padStart(2, "0") : "",
      text: review.text ?? "",
      files: [],
    });
    setEditingReview(review);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (reviewSaving) return;
    setReviewModalOpen(false);
    setEditingReview(null);
    setReviewForm({ ...emptyReviewForm });
    setReviewModalError("");
  };

  const handleReviewFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    setReviewForm((prev) => ({ ...prev, files: selected }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!editingReview?.id) {
      setReviewModalError("수정할 리뷰 정보를 찾지 못했습니다.");
      return;
    }
    if (reviewSaving) return;

    const rating = clamp5(reviewForm.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setReviewModalError("별점을 선택해주세요.");
      return;
    }
    const yearRaw = (reviewForm.visitYear || "").trim();
    const monthRaw = (reviewForm.visitMonth || "").trim();
    const dayRaw = (reviewForm.visitDay || "").trim();

    if (!yearRaw || !monthRaw || !dayRaw) {
      setReviewModalError("방문일을 모두 입력해주세요.");
      return;
    }

    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    const validDate =
      Number.isInteger(year) &&
      year >= 2000 &&
      year <= 9999 &&
      Number.isInteger(month) &&
      month >= 1 &&
      month <= 12 &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= 31;

    if (!validDate) {
      setReviewModalError("올바른 방문일을 입력해주세요.");
      return;
    }

    const visitDateISO = `${String(year).padStart(4, "0")}-${String(
      month
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const visitCheck = new Date(`${visitDateISO}T00:00:00Z`);
    if (Number.isNaN(visitCheck.getTime())) {
      setReviewModalError("방문일 형식이 올바르지 않습니다.");
      return;
    }

    const textContent = (reviewForm.text || "").trim();

    try {
      setReviewSaving(true);
      setReviewModalError("");
      await updateReview(editingReview.id, {
        rating,
        visitDate: visitDateISO,
        text: textContent,
        files: reviewForm.files,
      });
      toast.success("리뷰를 수정했습니다.");
      await refreshReviews();
      closeReviewModal();
    } catch (err) {
      console.error(err);
      const message = err?.message || "리뷰 수정에 실패했습니다.";
      setReviewModalError(message);
      toast.error(message);
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!review?.id) return;
    const confirmed = window.confirm("리뷰를 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await deleteReview(review.id);
      toast.success("리뷰를 삭제했습니다.");
      setLists((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((item) => item.id !== review.id),
      }));
      await refreshReviews();
    } catch (err) {
      console.error(err);
      const message = err?.message || "리뷰 삭제에 실패했습니다.";
      toast.error(message);
    }
  };

  const handleDeleteRestaurant = useCallback(async (restaurant) => {
    if (!restaurant?.id) return;
    if (!window.confirm("이 맛집을 삭제하시겠습니까?")) return;
    try {
      setDeletingRestaurantId(restaurant.id);
      await deleteRestaurant(restaurant.id);
      setLists((prev) => ({
        ...prev,
        myRestaurants: prev.myRestaurants.filter(
          (item) => item.id !== restaurant.id
        ),
        recent: prev.recent.filter((item) => item.id !== restaurant.id),
        favorites: prev.favorites.filter((item) => item.id !== restaurant.id),
      }));
      toast.success("맛집을 삭제했습니다.");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "맛집 삭제에 실패했습니다.");
    } finally {
      setDeletingRestaurantId(null);
    }
  }, []);

  const activeList = useMemo(() => {
    switch (section) {
      case "recent":
        return lists.recent;
      case "favorites":
        return lists.favorites;
      case "reviews":
        return lists.reviews;
      case "myRestaurants":
        return lists.myRestaurants;
      default:
        return [];
    }
  }, [lists, section]);

  const sectionLabel = useMemo(
    () =>
      MENU_ITEMS.find((item) => item.key === section)?.label ?? "마이페이지",
    [section]
  );

  const handleSignOut = async () => {
    try {
      await signOutApi();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  const openProfileModal = () => {
    setProfileFormError("");
    setProfileForm({
      nickname: profile?.nickname ?? "",
      avatar_url: profile?.avatar_url ?? "",
      address: profile?.address ?? "",
    });
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    if (profileSaving) return;
    setProfileModalOpen(false);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!user?.id) {
      setProfileFormError("로그인 상태를 확인해 주세요.");
      return;
    }

    const nickname = profileForm.nickname.trim();
    const avatarUrl = profileForm.avatar_url.trim();
    const address = profileForm.address;

    if (!nickname) {
      setProfileFormError("닉네임을 입력해 주세요.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileFormError("");

      const updated = await updateProfile(user.id, {
        nickname,
        avatar_url: avatarUrl || null,
        address,
      });

      setProfile(updated);
      setProfileModalOpen(false);
      toast.success("프로필이 업데이트되었습니다.");
    } catch (err) {
      console.error(err);
      setProfileFormError(err.message ?? "프로필 저장에 실패했습니다.");
    } finally {
      setProfileSaving(false);
    }
  };

  const displayName =
    profile?.nickname ?? (user?.email ? user.email.split("@")[0] : "사용자");
  const handleText = user?.email ? `@${user.email.split("@")[0]}` : "";
  const profileLocation = profile?.address ?? "서울특별시 관악구 호암로";

  return (
    <div className="min-h-screen bg-[#F47C4B]">
      <div className="px-12 pt-10">
        <Link to="/" aria-label="홈으로 이동" className="inline-block">
          <MzSvg className="h-16 w-auto" />
        </Link>
      </div>

      <div className="mx-auto flex max-w-[1320px] gap-10 px-12 pb-20 pt-10">
        <aside className="flex w-[260px] flex-shrink-0 flex-col rounded-[80px] bg-white py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-search-bg">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="프로필"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="h-16 w-16 text-gray-500" />
            )}
          </div>
          <div className="mt-6">
            <p className="text-2xl font-bold text-black">{displayName}</p>
            <p className="text-sm text-gray-500">{handleText}</p>
          </div>
          <p className="mt-3 text-sm text-gray-500">{profileLocation}</p>
          <div className="mt-6 flex flex-col gap-3 px-8">
            <button
              type="button"
              className="rounded-full bg-sub px-4 py-3 text-sm font-semibold text-white hover:bg-red-500"
              onClick={openProfileModal}
            >
              프로필 편집
            </button>
            <button
              type="button"
              className="rounded-full border border-rose-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-rose-50"
              onClick={handleSignOut}
            >
              로그아웃
            </button>
          </div>
          <nav className="mt-10 border-t border-rose-100 pt-6">
            <ul className="flex flex-col gap-2">
              {MENU_ITEMS.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setSection(item.key)}
                    className={`w-full rounded-full px-6 py-3 text-base font-semibold transition-colors ${
                      section === item.key
                        ? "bg-rose-100 text-sub"
                        : "text-gray-600 hover:bg-rose-50"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 rounded-[50px] bg-white px-16 py-14 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold text-black">마이페이지</h1>
            <span className="text-sm font-medium text-gray-500">
              {sectionLabel}
            </span>
          </header>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-gray-500">
              정보를 불러오는 중입니다...
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-rose-50 px-6 py-8 text-center text-gray-600">
              {error}
            </div>
          ) : activeList.length === 0 ? (
            <div className="rounded-3xl bg-rose-50 px-6 py-8 text-center text-gray-600">
              아직 {sectionLabel} 정보가 없습니다.
            </div>
          ) : section === "reviews" ? (
            <div className="flex flex-col gap-6">
              {activeList.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onEdit={openReviewModal}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {activeList.map((restaurant) => {
                let metaLabel = "";
                if (
                  section === "recent" &&
                  formatDateTime(restaurant.viewed_at)
                ) {
                  metaLabel = `${formatDateTime(restaurant.viewed_at)}에 방문`;
                } else if (
                  section === "favorites" &&
                  formatDateTime(restaurant.favorited_at)
                ) {
                  metaLabel = `${formatDateTime(
                    restaurant.favorited_at
                  )}에 즐겨찾기`;
                } else if (
                  section === "myRestaurants" &&
                  formatDateTime(restaurant.created_at)
                ) {
                  metaLabel = `${formatDateTime(restaurant.created_at)}에 등록`;
                }
                return (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    metaLabel={metaLabel}
                    canManage={section === "myRestaurants"}
                    onDelete={handleDeleteRestaurant}
                    deleting={deletingRestaurantId === restaurant.id}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-black">리뷰 수정</h2>
            <p className="mt-1 text-sm text-gray-500">
              수정할 내용을 입력하고 저장을 눌러주세요.
            </p>
            <form
              className="mt-6 flex flex-col gap-6"
              onSubmit={handleReviewSubmit}
            >
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  별점
                </span>
                <RatingSelector
                  value={reviewForm.rating}
                  onChange={(rating) =>
                    setReviewForm((prev) => ({ ...prev, rating }))
                  }
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  방문일
                </span>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={reviewForm.visitYear}
                    onChange={(event) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        visitYear: event.target.value,
                      }))
                    }
                    placeholder="년"
                    className="h-11 w-24 rounded-full border border-gray-200 px-4 text-center text-base focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={reviewForm.visitMonth}
                    onChange={(event) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        visitMonth: event.target.value,
                      }))
                    }
                    placeholder="월"
                    className="h-11 w-16 rounded-full border border-gray-200 px-3 text-center text-base focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={reviewForm.visitDay}
                    onChange={(event) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        visitDay: event.target.value,
                      }))
                    }
                    placeholder="일"
                    className="h-11 w-16 rounded-full border border-gray-200 px-3 text-center text-base focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  리뷰 내용
                </span>
                <textarea
                  value={reviewForm.text}
                  onChange={(event) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      text: event.target.value,
                    }))
                  }
                  placeholder="리뷰 내용을 입력하세요."
                  className="min-h-[180px] rounded-3xl border border-gray-200 px-5 py-4 text-base text-gray-800 focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                />
              </div>

              {editingReview?.images?.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold text-gray-700">
                    기존 사진
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {editingReview.images.slice(0, 6).map((src, idx) => (
                      <img
                        key={`${editingReview.id}-existing-${idx}`}
                        src={src}
                        alt="기존 리뷰 이미지"
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    새 이미지를 추가하면 기존 이미지와 함께 노출돼요.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  사진 추가 (선택)
                </span>
                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-rose-200 bg-rose-50 text-red-400 transition-colors hover:bg-rose-100">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-300 text-2xl text-white">
                    +
                  </span>
                  <span className="text-sm font-medium">
                    클릭하여 사진을 선택하세요
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReviewFileChange}
                    className="hidden"
                  />
                </label>
                {reviewForm.files.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {reviewForm.files.length}개의 사진이 선택되었습니다.
                  </p>
                )}
              </div>

              {reviewModalError && (
                <p className="text-sm text-red-500">{reviewModalError}</p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  disabled={reviewSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-sub px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                  disabled={reviewSaving}
                >
                  {reviewSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-black">프로필 편집</h2>
            <p className="mt-1 text-sm text-gray-500">
              닉네임과 프로필 이미지를 수정하세요.
            </p>
            <form
              className="mt-6 flex flex-col gap-5"
              onSubmit={handleProfileSubmit}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                닉네임
                <input
                  type="text"
                  name="nickname"
                  value={profileForm.nickname}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  placeholder="닉네임을 입력하세요"
                  maxLength={30}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                프로필 이미지 URL
                <input
                  type="url"
                  name="avatar_url"
                  value={profileForm.avatar_url}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  placeholder="https://example.com/avatar.png"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                활동 지역
                <input
                  type="text"
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-sub focus:outline-none focus:ring-2 focus:ring-sub/30"
                  placeholder="서울특별시 관악구 신림동"
                />
              </label>
              {profileFormError && (
                <p className="text-sm text-red-500">{profileFormError}</p>
              )}
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  disabled={profileSaving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-sub px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                  disabled={profileSaving}
                >
                  {profileSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/** TODO: 추가 모달이나 페이지 섹션을 여기에 배치 */}
    </div>
  );
}

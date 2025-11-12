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

export async function updateReview(
  reviewId,
  { rating, visitDate, text, files, removeImageIds = [] }
) {
  const { data, error } = await supabase.from("reviews").upsert(
    {
      id: reviewId,
      rating,
      visit_date: visitDate,
      text_content: text,
    },
    { returning: "minimal" }
  );

  if (error) throw error;

  const currentReviewId = data?.id ?? reviewId;

  const removeIds = Array.isArray(removeImageIds)
    ? removeImageIds.filter(Boolean)
    : [];
  if (removeIds.length > 0) {
    const { error: removeErr } = await supabase
      .from("review_images")
      .delete()
      .in("id", removeIds)
      .eq("review_id", currentReviewId);
    if (removeErr) throw removeErr;
  }

  const filesToUpload = Array.isArray(files) ? files.filter(Boolean) : [];
  if (filesToUpload.length === 0) {
    return { id: currentReviewId, removed: removeIds.length };
  }

  // ...existing code for file upload
}

const emptyReviewForm = {
  rating: 0,
  visitYear: "",
  visitMonth: "",
  visitDay: "",
  text: "",
  newPhotos: [],
  removeImageIds: [],
};

export function ReviewModule() {
  // ...existing code...

  const revokeNewPhotoPreviews = useCallback((photos) => {
    photos.forEach((item) => {
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  const openReviewModal = (review) => {
    if (!review) return;
    setEditingReview(review);
    setReviewForm({
      id: review.id,
      rating: review.rating,
      visitYear: review.visit_date?.getFullYear() ?? "",
      visitMonth: String(review.visit_date?.getMonth() + 1).padStart(2, "0"),
      visitDay: String(review.visit_date?.getDate()).padStart(2, "0"),
      text: review.text_content,
      newPhotos: [],
      removeImageIds: [],
    });
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (reviewSaving) return;
    revokeNewPhotoPreviews(reviewForm.newPhotos);
    setReviewModalOpen(false);
    setEditingReview(null);
    setReviewForm({ ...emptyReviewForm });
    setReviewModalError("");
  };

  const handleReviewFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    const valid = selected.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    if (valid.length < selected.length) {
      toast.error("이미지는 5MB 이하만 업로드할 수 있습니다.");
    }
    const existingKeys = new Set(
      reviewForm.newPhotos.map(
        (item) =>
          `${item.file.name}_${item.file.size}_${item.file.lastModified}`
      )
    );
    const additions = valid
      .filter(
        (file) =>
          !existingKeys.has(`${file.name}_${file.size}_${file.lastModified}`)
      )
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    if (additions.length === 0) {
      event.target.value = "";
      return;
    }
    setReviewForm((prev) => ({
      ...prev,
      newPhotos: [...prev.newPhotos, ...additions],
    }));
    event.target.value = "";
  };

  const handleRemoveNewPhoto = (index) => {
    setReviewForm((prev) => {
      const target = prev.newPhotos[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return {
        ...prev,
        newPhotos: prev.newPhotos.filter((_, i) => i !== index),
      };
    });
  };

  const toggleRemoveExistingImage = (imageId) => {
    if (!imageId) return;
    setReviewForm((prev) => {
      const next = new Set(prev.removeImageIds);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return { ...prev, removeImageIds: Array.from(next) };
    });
  };

  const submitReview = async () => {
    setReviewModalError("");
    const { rating, visitYear, visitMonth, visitDay, text } = reviewForm;
    if (rating <= 0) {
      setReviewModalError("평점을 선택해주세요.");
      return;
    }
    if (!visitYear || !visitMonth || !visitDay) {
      setReviewModalError("방문 일자를 선택해주세요.");
      return;
    }
    const visitDateISO = new Date(
      `${visitYear}-${visitMonth}-${visitDay}T00:00:00`
    ).toISOString();
    const textContent = text.trim();
    if (textContent.length === 0) {
      setReviewModalError("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      setReviewSaving(true);
      if (editingReview) {
        await updateReview(editingReview.id, {
          rating,
          visitDate: visitDateISO,
          text: textContent,
          files: reviewForm.newPhotos.map((item) => item.file),
          removeImageIds: reviewForm.removeImageIds,
        });
      } else {
        // ...existing code for creating a review
      }
      closeReviewModal();
      // ...existing code for refetching data
    } catch (error) {
      setReviewModalError("리뷰 저장에 실패했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div>
      {/* ...existing code... */}
      {Array.isArray(review.images) && review.images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {review.images.slice(0, 4).map((img, idx) => {
            const imageUrl = typeof img === "string" ? img : img?.url ?? null;
            if (!imageUrl) return null;
            return (
              <img
                key={`${review.id}-photo-${idx}`}
                src={imageUrl}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover"
                loading="lazy"
              />
            );
          })}
        </div>
      )}
      {/* ...existing code... */}
      {editingReview?.images?.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-gray-700">기존 사진</span>
          <div className="flex flex-wrap gap-3">
            {editingReview.images.slice(0, 6).map((img, idx) => {
              const imageId = typeof img === "string" ? null : img?.id;
              const imageUrl = typeof img === "string" ? img : img?.url ?? null;
              if (!imageUrl) return null;
              const marked =
                !!imageId && reviewForm.removeImageIds.includes(imageId);
              return (
                <button
                  type="button"
                  key={`${editingReview.id}-existing-${idx}`}
                  onClick={() => toggleRemoveExistingImage(imageId)}
                  disabled={!imageId}
                  className="relative h-20 w-20 overflow-hidden rounded-2xl border border-transparent transition hover:border-red-400 disabled:cursor-not-allowed"
                >
                  <img
                    src={imageUrl}
                    alt="기존 리뷰 이미지"
                    className="h-full w-full object-cover"
                  />
                  {marked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white">
                      삭제 예정
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            이미지를 클릭하면 삭제/복원할 수 있어요.
          </p>
        </div>
      )}
      {/* ...existing code... */}
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
        {reviewForm.newPhotos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {reviewForm.newPhotos.map((item, idx) => (
              <button
                type="button"
                key={`new-photo-${idx}`}
                onClick={() => handleRemoveNewPhoto(idx)}
                className="group relative h-20 w-20 overflow-hidden rounded-2xl"
              >
                <img
                  src={item.previewUrl}
                  alt="선택한 리뷰 이미지"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/60 text-xs font-semibold text-white group-hover:flex">
                  삭제
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

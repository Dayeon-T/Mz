import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import MzSvg from "../assets/mz맛집.svg?react";
import { supabase } from "../lib/supabase";

const clamp5 = (value) => Math.max(0, Math.min(5, Number(value) || 0));

const MAX_REVIEW_IMAGE_SIZE = 5 * 1024 * 1024;

const makeFileSignature = (file) =>
  `${file.name}_${file.size}_${file.lastModified}`;

const createPreviewItem = (file) => ({
  file,
  previewUrl: URL.createObjectURL(file),
});

const releasePreviews = (items = []) => {
  items.forEach((item) => {
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
};

const StarIcon = ({ filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 37 35"
    className="h-12 w-12"
    aria-hidden="true"
  >
    <path
      d="M18.2744 2.21011C18.5031 1.51302 19.497 1.51302 19.7257 2.21011L22.6024 10.8962C22.7057 11.2054 22.9945 11.4136 23.3243 11.4136H32.4392C33.1727 11.4136 33.4772 12.3574 32.8899 12.7703L25.531 17.9736C25.2709 18.1563 25.1625 18.4894 25.2658 18.7986L28.1425 27.4847C28.3712 28.1818 27.5743 28.7626 26.987 28.3497L19.6281 23.1464C19.3679 22.9637 19.048 22.9637 18.7879 23.1464L11.429 28.3497C10.8417 28.7626 10.0448 28.1818 10.2735 27.4847L13.1502 18.7986C13.2535 18.4894 13.1451 18.1563 12.885 17.9736L5.52607 12.7703C4.93877 12.3574 5.24327 11.4136 5.97677 11.4136H15.0917C15.4216 11.4136 15.7104 11.2054 15.8137 10.8962L18.6904 2.21011C18.9191 1.51302 19.913 1.51302 20.1417 2.21011Z"
      fill={filled ? "#FF6C6F" : "#E2E2E2"}
    />
  </svg>
);

const RatingInput = ({ value, onChange }) => (
  <div className="flex items-center gap-3">
    {[1, 2, 3, 4, 5].map((score) => {
      const filled = score <= clamp5(value);
      return (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className="transition-transform hover:scale-105"
          aria-label={`${score}점 선택`}
        >
          <StarIcon filled={filled} />
        </button>
      );
    })}
  </div>
);

const initialFormState = {
  rating: 0,
  visitYear: "",
  visitMonth: "",
  visitDay: "",
  text: "",
  newPhotos: [],
};

export default function ReviewForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    const valid = selected.filter(
      (file) =>
        file.type.startsWith("image/") && file.size <= MAX_REVIEW_IMAGE_SIZE
    );

    if (valid.length < selected.length) {
      toast.error("이미지는 5MB 이하의 이미지 파일만 업로드할 수 있어요.");
    }

    setForm((prev) => {
      const existingKeys = new Set(
        prev.newPhotos.map((item) => makeFileSignature(item.file))
      );
      const additions = valid
        .filter((file) => !existingKeys.has(makeFileSignature(file)))
        .map((file) => createPreviewItem(file));

      if (additions.length === 0) {
        return prev;
      }

      return {
        ...prev,
        newPhotos: [...prev.newPhotos, ...additions],
      };
    });

    event.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setForm((prev) => {
      const target = prev.newPhotos[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return {
        ...prev,
        newPhotos: prev.newPhotos.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const restaurantId = id?.trim();
    if (!restaurantId) {
      toast.error("가게 정보를 확인할 수 없어요.");
      return;
    }

    const rating = Math.round(Number(form.rating) || 0);
    if (rating < 1 || rating > 5) {
      toast.error("별점을 선택해주세요.");
      return;
    }

    const yearRaw = form.visitYear.trim();
    const monthRaw = form.visitMonth.trim();
    const dayRaw = form.visitDay.trim();
    if (!yearRaw || !monthRaw || !dayRaw) {
      toast.error("방문일을 모두 입력해주세요.");
      return;
    }

    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 9999 ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31
    ) {
      toast.error("올바른 방문일을 입력해주세요.");
      return;
    }

    const visitDateISO = `${String(year).padStart(4, "0")}-${String(
      month
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const visitDate = new Date(`${visitDateISO}T00:00:00Z`);
    if (Number.isNaN(visitDate.getTime())) {
      toast.error("방문일 형식이 올바르지 않습니다.");
      return;
    }

    const textContent = form.text.trim();

    const uploadReviewImage = async (
      file,
      index,
      ownerId,
      reviewId,
      attempt = 0
    ) => {
      const bucket = "review-images";
      const ext = file.name?.split(".")?.pop()?.toLowerCase() || "jpg";
      const randomUuid =
        globalThis.crypto?.randomUUID?.() ||
        Math.random().toString(36).slice(2);
      const uniqueKey = `${randomUuid}_${Date.now()}_${index}`;
      const storagePath = `${ownerId}/${reviewId}/${uniqueKey}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadErr) {
        const duplicate =
          typeof uploadErr.message === "string" &&
          /duplicate key value|already exists/i.test(uploadErr.message);
        if (duplicate && attempt < 3) {
          return uploadReviewImage(file, index, ownerId, reviewId, attempt + 1);
        }
        throw uploadErr;
      }

      const { data: signedData, error: signedErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
      if (!signedErr && signedData?.signedUrl) {
        return signedData.signedUrl;
      }

      const { data: publicData, error: publicErr } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);
      if (!publicErr && publicData?.publicUrl) {
        return publicData.publicUrl;
      }

      throw new Error("이미지 URL을 생성하지 못했습니다.");
    };

    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user?.id) throw new Error("로그인이 필요합니다.");

      const { data: inserted, error: insertErr } = await supabase
        .from("reviews")
        .insert({
          restaurant_id: restaurantId,
          user_id: user.id,
          rating,
          visit_date: visitDateISO,
          text_content: textContent || null,
        })
        .select("id")
        .single();

      if (insertErr) {
        if (
          typeof insertErr.message === "string" &&
          /unique|duplicate/i.test(insertErr.message)
        ) {
          throw new Error("이미 해당 일자에 리뷰를 작성하셨습니다.");
        }
        throw insertErr;
      }

      const reviewId = inserted?.id;
      if (!reviewId) {
        throw new Error("리뷰 ID를 확인할 수 없습니다.");
      }

      const filesToUpload = form.newPhotos
        .map((item) => item?.file)
        .filter(Boolean);

      if (filesToUpload.length > 0) {
        const uploads = [];
        for (let idx = 0; idx < filesToUpload.length; idx += 1) {
          const file = filesToUpload[idx];
          try {
            const url = await uploadReviewImage(file, idx, user.id, reviewId);
            uploads.push({ url, sort_order: idx });
          } catch (uploadErr) {
            console.error("Review image upload failed", uploadErr);
            toast.error(
              uploadErr?.message || "리뷰 이미지를 업로드하지 못했어요."
            );
          }
        }

        if (uploads.length > 0) {
          const { error: linkErr } = await supabase
            .from("review_images")
            .insert(
              uploads.map((item) => ({
                review_id: reviewId,
                url: item.url,
                sort_order: item.sort_order,
              }))
            );

          if (linkErr) {
            console.error(linkErr);
            toast.error(
              linkErr.message || "리뷰 이미지 정보를 저장하지 못했어요."
            );
          }
        }
      }

      toast.success("리뷰가 등록되었습니다!");
      releasePreviews(form.newPhotos);
      navigate(`/store/${restaurantId}`, { replace: true });
    } catch (error) {
      console.error(error);
      const message = error?.message || "리뷰 등록 중 문제가 발생했습니다.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    releasePreviews(form.newPhotos);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F47C4B]">
      <div className="max-w-[1100px] mx-auto py-12 px-16">
        <header className="flex items-center gap-4 mb-10 text-white">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full bg-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/30 transition-colors"
          >
            &lt; 돌아가기
          </button>
          <MzSvg className="h-16 w-auto" aria-label="엠지맛집 로고" />
          <div className="ml-auto text-lg font-semibold">
            {id ? `매장 #${id} 리뷰 작성` : "리뷰 작성"}
          </div>
        </header>

        <main className="rounded-[36px] bg-white px-16 py-14 shadow-lg">
          <form className="flex flex-col gap-14" onSubmit={handleSubmit}>
            <section className="flex flex-col gap-6">
              <h1 className="text-3xl font-semibold text-black">리뷰작성</h1>
              <div className="flex flex-wrap items-start justify-between gap-10">
                <div className="flex flex-col gap-4 text-black">
                  <p className="text-xl font-semibold">별점을 남겨주세요!</p>
                  <RatingInput
                    value={form.rating}
                    onChange={(rating) =>
                      setForm((prev) => ({ ...prev, rating }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-4 text-black">
                  <p className="text-xl font-semibold">방문일</p>
                  <div className="flex items-center gap-4 text-base">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.visitYear}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          visitYear: event.target.value,
                        }))
                      }
                      placeholder="년"
                      className="h-12 w-24 rounded-full bg-gray-100 px-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={form.visitMonth}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          visitMonth: event.target.value,
                        }))
                      }
                      placeholder="월"
                      className="h-12 w-16 rounded-full bg-gray-100 px-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={form.visitDay}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          visitDay: event.target.value,
                        }))
                      }
                      placeholder="일"
                      className="h-12 w-16 rounded-full bg-gray-100 px-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-10 text-black lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold">텍스트 리뷰</h2>
                <textarea
                  value={form.text}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, text: event.target.value }))
                  }
                  placeholder="ex) 혼밥하기 좋아요!"
                  className="min-h-[220px] w-full rounded-3xl bg-gray-100 px-6 py-5 text-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold">포토리뷰 (선택)</h2>
                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl bg-rose-200/80 text-red-500 transition-colors hover:bg-rose-200">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-red-300 text-3xl text-white">
                    +
                  </div>
                  <p className="text-base font-medium text-center text-red-400">
                    클릭하여 사진을 추가하세요
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {form.newPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {form.newPhotos.map((item, idx) => (
                      <button
                        type="button"
                        key={`preview-${idx}`}
                        onClick={() => handleRemovePhoto(idx)}
                        className="group relative h-24 w-24 overflow-hidden rounded-2xl"
                        aria-label="선택한 사진 삭제"
                      >
                        <img
                          src={item.previewUrl}
                          alt="선택한 리뷰 이미지"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute inset-0 hidden items-center justify-center bg-black/60 text-sm font-semibold text-white group-hover:flex">
                          삭제
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="h-12 rounded-full px-8 text-lg font-semibold text-gray-600 transition-colors hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="submit"
                className="h-12 rounded-full bg-red-400 px-10 text-lg font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "등록 중..." : "등록완료"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

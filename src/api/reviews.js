import { supabase } from "../lib/supabase";

const clamp5 = (value) =>
  Math.max(1, Math.min(5, Math.round(Number(value) || 0)));

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
    globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
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

export async function updateReview(
  reviewId,
  { rating, visitDate, text, files, removeImageIds = [] }
) {
  if (!reviewId) throw new Error("리뷰 정보를 찾을 수 없습니다.");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  const updates = {};
  if (typeof rating !== "undefined") {
    updates.rating = clamp5(rating);
  }
  if (visitDate) {
    updates.visit_date = visitDate;
  }
  updates.text_content = text ? text.trim() || null : null;

  const { data, error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) throw error;

  const currentReviewId = data?.id ?? reviewId;
  const removeIds = Array.isArray(removeImageIds)
    ? Array.from(
        new Set(
          removeImageIds
            .map((value) => {
              if (typeof value === "number" || typeof value === "string") {
                return value;
              }
              return null;
            })
            .filter((value) => value !== null)
        )
      )
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

  let offset = 0;
  try {
    const { data: existingImages } = await supabase
      .from("review_images")
      .select("sort_order")
      .eq("review_id", currentReviewId)
      .order("sort_order", { ascending: false });
    if (existingImages && existingImages.length > 0) {
      offset =
        Math.max(
          ...existingImages.map((row) =>
            typeof row.sort_order === "number" ? row.sort_order : 0
          )
        ) + 1;
    }
  } catch (existingErr) {
    console.error(existingErr);
  }

  const uploads = [];
  for (let idx = 0; idx < filesToUpload.length; idx += 1) {
    const file = filesToUpload[idx];
    try {
      const url = await uploadReviewImage(file, idx, user.id, currentReviewId);
      uploads.push({ url, sort_order: offset + idx });
    } catch (uploadErr) {
      console.error(uploadErr);
    }
  }

  if (uploads.length === 0) {
    return { id: currentReviewId, removed: removeIds.length };
  }

  const { error: linkErr } = await supabase.from("review_images").insert(
    uploads.map((item) => ({
      review_id: currentReviewId,
      url: item.url,
      sort_order: item.sort_order,
    }))
  );

  if (linkErr) throw linkErr;

  return {
    id: currentReviewId,
    removed: removeIds.length,
    imagesAdded: uploads.length,
  };
}

export async function deleteReview(reviewId) {
  if (!reviewId) throw new Error("리뷰 정보를 찾을 수 없습니다.");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("로그인이 필요합니다.");

  try {
    await supabase.from("review_images").delete().eq("review_id", reviewId);
  } catch (imageErr) {
    console.error(imageErr);
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) throw error;

  const { data: stillExists, error: checkErr } = await supabase
    .from("reviews")
    .select("id")
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (checkErr && checkErr.code !== "PGRST116") {
    throw checkErr;
  }

  if (stillExists) {
    throw new Error("삭제할 리뷰를 찾을 수 없습니다.");
  }
}

import { useState, useEffect } from "react";
import ModalBlur from "../components/ModalBlur.jsx";
import Addtime from "../assets/addtime.svg?react";
import AddImage from "../assets/image.svg?react";
import CheckBox from "../components/CheckBox.jsx";
import Marker from "../assets/marker.svg?react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

let kakaoServicesPromise = null;

const inputstyle =
  "h-8 bg-[#ECECEC] rounded-[20px] w-[31%] focus:outline-none px-4 focus:ring-1 ring-main/70 text-[18px] font-medium placeholder:font-medium placeholder:text-[18px]";
const timeinput =
  "bg-[#ECECEC] flex-1 h-8 rounded-full text-center w-[45%] focus:outline-none px-4 focus:ring-1 ring-main/70 ";

export default function AddmzModal({ onClose, restaurant = null, onSaved }) {
  const { user, authLoading } = useAuth();
  const isEditing = !!restaurant?.id;
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [timeMode, setTimeMode] = useState("everyday"); // 'everyday' or 'daybyday'
  const [selectedDay, setSelectedDay] = useState(0); // 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
  const [step, setStep] = useState(1); // 1: 기본 정보, 2: 추가 정보

  // 매일 같은 시간 영업
  const [is24Hours, setIs24Hours] = useState(false);
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");

  // 요일별 영업시간 (7일치)
  const [daySchedules, setDaySchedules] = useState(
    Array.from({ length: 7 }, () => ({
      isClosed: false,
      is24Hours: false,
      startHour: "",
      startMinute: "",
      endHour: "",
      endMinute: "",
    }))
  );

  const updateDaySchedule = (dayIndex, field, value) => {
    const newSchedules = [...daySchedules];
    newSchedules[dayIndex] = { ...newSchedules[dayIndex], [field]: value };
    setDaySchedules(newSchedules);
  };

  // 여러 필드를 한 번에 갱신하기 위한 헬퍼 (배치 업데이트로 값 유실 방지)
  const updateDayScheduleMany = (dayIndex, patch) => {
    setDaySchedules((prev) => {
      const next = [...prev];
      next[dayIndex] = { ...prev[dayIndex], ...patch };
      return next;
    });
  };

  useEffect(() => {
    // 다음 우편번호 스크립트 로드
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // cleanup: 스크립트 제거
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleAddressSearch = () => {
    if (!window.daum) {
      console.error("다음 우편번호 API가 로드되지 않았습니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        // 도로명 주소 우선, 없으면 지번 주소
        const addr = data.roadAddress || data.jibunAddress;
        setZonecode(data.zonecode);
        setAddress(addr);
        // 상세주소 입력 필드로 포커스 이동
        document.getElementById("detail-address")?.focus();
      },
    }).open();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && typeof onClose === "function") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [name, setName] = useState("");
  const [phoneA, setPhoneA] = useState("");
  const [phoneB, setPhoneB] = useState("");
  const [phoneC, setPhoneC] = useState("");
  const [hasTakeout, setHasTakeout] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);
  const [hasReservation, setHasReservation] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasWifi, setHasWifi] = useState(false);
  const [markerEmoji, setMarkerEmoji] = useState("");
  const [tagline, setTagline] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 이미지 업로드: 선택한 파일과 미리보기 URL
  const [imageFiles, setImageFiles] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[] (object URL)

  // 파일 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    // 이미지 파일만 필터, 5MB 제한
    const candidates = files.filter(
      (f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024
    );
    if (candidates.length < files.length) {
      toast.error(
        "이미지 파일만 선택 가능하며, 최대 5MB까지 업로드할 수 있어요."
      );
    }
    // 중복 방지: name+size+lastModified 키로 기존과 비교
    const existsKey = new Set(
      imageFiles.map((f) => `${f.name}_${f.size}_${f.lastModified}`)
    );
    const newFiles = candidates.filter(
      (f) => !existsKey.has(`${f.name}_${f.size}_${f.lastModified}`)
    );
    if (newFiles.length === 0) return;
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleRemoveImageAt = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      const toRemove = prev[idx];
      if (toRemove) URL.revokeObjectURL(toRemove);
      return prev.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    // 언마운트 시 미리보기 URL 정리
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const ensureKakaoServices = () => {
    if (window.kakao?.maps?.services) {
      return Promise.resolve(window.kakao.maps.services);
    }

    if (kakaoServicesPromise) {
      return kakaoServicesPromise;
    }

    kakaoServicesPromise = new Promise((resolve, reject) => {
      const finish = () => {
        if (window.kakao?.maps?.services) {
          resolve(window.kakao.maps.services);
        } else {
          kakaoServicesPromise = null;
          reject(
            new Error(
              "카카오 지도 서비스 로드에 실패했습니다. 새로고침 후 다시 시도해주세요."
            )
          );
        }
      };

      const handleLoad = () => {
        if (!window.kakao?.maps?.load) {
          kakaoServicesPromise = null;
          reject(
            new Error(
              "카카오 지도 SDK 초기화에 실패했습니다. 새로고침 후 다시 시도해주세요."
            )
          );
          return;
        }
        window.kakao.maps.load(() => finish());
      };

      if (window.kakao?.maps) {
        handleLoad();
        return;
      }

      const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
      if (!apiKey) {
        kakaoServicesPromise = null;
        reject(
          new Error(
            "카카오 지도 API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요."
          )
        );
        return;
      }

      let script = document.querySelector('script[data-kakao-sdk="maps"]');
      if (!script) {
        script = document.createElement("script");
        script.async = true;
        script.defer = true;
        script.dataset.kakaoSdk = "maps";
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
        document.head.appendChild(script);
      }

      const onLoad = () => {
        script?.removeEventListener("load", onLoad);
        script?.removeEventListener("error", onError);
        handleLoad();
      };

      const onError = () => {
        script?.removeEventListener("load", onLoad);
        script?.removeEventListener("error", onError);
        kakaoServicesPromise = null;
        reject(
          new Error(
            "카카오 지도 SDK 로드에 실패했습니다. 플랫폼 설정을 확인해주세요."
          )
        );
      };

      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
    });

    return kakaoServicesPromise;
  };

  // 카카오 지도 SDK Geocoder로 주소 → 좌표
  const geocodeAddress = async (fullAddress) => {
    await ensureKakaoServices();

    return new Promise((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(fullAddress, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
          resolve({
            lat: parseFloat(result[0].y),
            lng: parseFloat(result[0].x),
          });
          return;
        }
        reject(new Error("주소를 좌표로 변환할 수 없습니다."));
      });
    });
  };

  const toTimeString = (hh, mm) => {
    let H = Math.max(0, Math.min(24, parseInt(hh || "0", 10) || 0));
    let M = Math.max(0, Math.min(59, parseInt(mm || "0", 10) || 0));
    if (H === 24) {
      H = 23;
      M = 59;
    }
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}:00`;
  };

  const buildOpenClose = () => {
    if (timeMode === "everyday") {
      if (is24Hours) {
        return { open_time: "00:00:00", close_time: "23:59:00" };
      }
      return {
        open_time: toTimeString(startHour, startMinute),
        close_time: toTimeString(endHour, endMinute),
      };
    }
    // daybyday: 선택된 요일의 시간으로 저장(스키마가 하루 단일 시간만 지원)
    const day = daySchedules[selectedDay];
    if (day.isClosed)
      throw new Error(
        "선택한 요일이 휴무일입니다. 다른 요일을 선택하거나 매일 동일 시간으로 설정하세요."
      );
    if (day.is24Hours) return { open_time: "00:00:00", close_time: "23:59:00" };
    return {
      open_time: toTimeString(day.startHour, day.startMinute),
      close_time: toTimeString(day.endHour, day.endMinute),
    };
  };

  useEffect(() => {
    if (!restaurant) {
      setStep(1);
      setAddress("");
      setDetailAddress("");
      setZonecode("");
      setName("");
      setPhoneA("");
      setPhoneB("");
      setPhoneC("");
      setHasTakeout(false);
      setHasDelivery(false);
      setHasReservation(false);
      setHasParking(false);
      setHasWifi(false);
      setMarkerEmoji("");
      setTagline("");
      setCategoryInput("");
      setTimeMode("everyday");
      setIs24Hours(false);
      setStartHour("");
      setStartMinute("");
      setEndHour("");
      setEndMinute("");
      setDaySchedules(
        Array.from({ length: 7 }, () => ({
          isClosed: false,
          is24Hours: false,
          startHour: "",
          startMinute: "",
          endHour: "",
          endMinute: "",
        }))
      );
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }

    const [first = "", second = "", third = ""] = (
      restaurant.phone || ""
    ).split("-");
    setStep(1);
    setAddress(restaurant.address || "");
    setDetailAddress("");
    setZonecode("");
    setName(restaurant.name || "");
    setPhoneA(first);
    setPhoneB(second);
    setPhoneC(third);
    setHasTakeout(!!restaurant.has_takeout);
    setHasDelivery(!!restaurant.has_delivery);
    setHasReservation(!!restaurant.has_reservation);
    setHasParking(!!restaurant.has_parking);
    setHasWifi(!!restaurant.has_wifi);
    setMarkerEmoji(restaurant.marker_emoji || "");
    setTagline(restaurant.tagline || "");
    setCategoryInput(
      Array.isArray(restaurant.categories) && restaurant.categories.length > 0
        ? restaurant.categories.join(", ")
        : ""
    );

    const splitTime = (time) => {
      if (!time) return ["", ""];
      const parts = time.split(":");
      return [parts[0] || "", parts[1] || ""];
    };

    const [openH, openM] = splitTime(restaurant.open_time);
    const [closeH, closeM] = splitTime(restaurant.close_time);
    const is24 =
      (restaurant.open_time || "").startsWith("00") &&
      (restaurant.close_time || "").startsWith("23");

    setTimeMode("everyday");
    setIs24Hours(is24);
    if (!is24) {
      setStartHour(openH);
      setStartMinute(openM);
      setEndHour(closeH);
      setEndMinute(closeM);
    } else {
      setStartHour("");
      setStartMinute("");
      setEndHour("");
      setEndMinute("");
    }
    setImageFiles([]);
    setImagePreviews([]);
  }, [restaurant]);

  const normalizeAddress = (value) => (value || "").replace(/\s+/g, " ").trim();

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;

    console.log("[맛집 등록] 시작");
    setSubmitting(true);

    try {
      if (authLoading) {
        throw new Error(
          "로그인 정보를 확인하는 중입니다. 잠시 후 다시 시도해주세요."
        );
      }
      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }
      console.log("[맛집 등록] user.id:", user.id);

      // --- 기본 검증 ---
      if (!name.trim()) {
        toast.error("가게명을 입력하세요.");
        return;
      }
      if (!address.trim()) {
        toast.error("주소를 입력하세요.");
        return;
      }

      const fullAddress = detailAddress.trim()
        ? `${address} ${detailAddress}`
        : address;
      console.log("[맛집 등록] 주소:", fullAddress);

      const phone = [phoneA, phoneB, phoneC].filter(Boolean).join("-");
      const { open_time, close_time } = buildOpenClose();
      console.log("[맛집 등록] 영업시간:", open_time, "~", close_time);

      // --- 좌표 계산 (필요한 경우만) ---
      const requiresGeocode =
        !isEditing ||
        normalizeAddress(fullAddress) !==
          normalizeAddress(restaurant?.address) ||
        !restaurant?.lat ||
        !restaurant?.lng;

      let coords = {
        lat: restaurant?.lat ?? null,
        lng: restaurant?.lng ?? null,
      };

      if (requiresGeocode) {
        console.log("[맛집 등록] 지오코딩 시작:", fullAddress);
        try {
          coords = await geocodeAddress(fullAddress);
          console.log("[맛집 등록] 지오코딩 성공:", coords);
        } catch (geoErr) {
          console.error("[맛집 등록] 지오코딩 실패:", geoErr);
          throw new Error(
            "주소를 좌표로 변환하지 못했어요. 주소를 다시 확인해 주세요."
          );
        }
      } else {
        console.log("[맛집 등록] 기존 좌표 사용:", coords);
      }

      // --- DB 저장 ---
      let restaurantId = restaurant?.id ?? null;
      let inserted = null;

      if (isEditing) {
        console.log("[맛집 등록] 수정 모드:", restaurantId);
        const { error: updateErr } = await supabase
          .from("restaurants")
          .update({
            name: name.trim(),
            address: fullAddress,
            phone: phone || null,
            open_time,
            close_time,
            break_start: null,
            break_end: null,
            lat: coords.lat,
            lng: coords.lng,
            has_takeout: !!hasTakeout,
            has_delivery: !!hasDelivery,
            has_reservation: !!hasReservation,
            has_parking: !!hasParking,
            has_wifi: !!hasWifi,
            marker_emoji: markerEmoji || null,
            tagline: tagline || null,
            extra_note: null,
          })
          .eq("id", restaurant.id);

        if (updateErr) {
          console.error("[맛집 등록] 수정 실패:", updateErr);
          throw updateErr;
        }
        console.log("[맛집 등록] 수정 완료");
      } else {
        console.log("[맛집 등록] 신규 등록 시작");

        const { data: created, error: insertErr } = await supabase
          .from("restaurants")
          .insert({
            name: name.trim(),
            address: fullAddress,
            phone: phone || null,
            open_time,
            close_time,
            break_start: null,
            break_end: null,
            lat: coords.lat,
            lng: coords.lng,
            has_takeout: !!hasTakeout,
            has_delivery: !!hasDelivery,
            has_reservation: !!hasReservation,
            has_parking: !!hasParking,
            has_wifi: !!hasWifi,
            marker_emoji: markerEmoji || null,
            tagline: tagline || null,
            extra_note: null,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (insertErr) {
          console.error("[맛집 등록] DB 삽입 실패:", insertErr);
          throw insertErr;
        }

        console.log("[맛집 등록] DB 삽입 성공:", created);
        inserted = created;
      }

      if (!restaurantId) {
        restaurantId = inserted?.id;
      }
      if (!restaurantId) {
        throw new Error("맛집 ID를 확인할 수 없습니다.");
      }

      console.log("[맛집 등록] 레스토랑 ID 확인:", restaurantId);

      // 카테고리 처리
      const parseCategories = (raw) => {
        if (!raw) return [];
        const tokens = raw
          .split(/[,\n\t\s]+/)
          .map((name) => name.trim().replace(/^#/, ""))
          .filter(Boolean);
        return Array.from(new Set(tokens));
      };

      const categoryNames = parseCategories(categoryInput);
      if (categoryNames.length > 0) {
        try {
          const { data: existingCategories } = await supabase
            .from("categories")
            .select("id, name")
            .in("name", categoryNames);

          const nameToId = new Map(
            (existingCategories || []).map((item) => [item.name, item.id])
          );

          const missingNames = categoryNames.filter(
            (name) => !nameToId.has(name)
          );

          if (missingNames.length > 0) {
            const { data: insertedCategories } = await supabase
              .from("categories")
              .insert(missingNames.map((name) => ({ name })))
              .select("id, name");

            (insertedCategories || []).forEach((item) => {
              nameToId.set(item.name, item.id);
            });
          }

          const categoryIds = categoryNames
            .map((name) => nameToId.get(name))
            .filter(Boolean);

          if (categoryIds.length > 0) {
            if (isEditing) {
              await supabase
                .from("restaurant_categories")
                .delete()
                .eq("restaurant_id", restaurantId);
            }

            await supabase.from("restaurant_categories").upsert(
              categoryIds.map((id) => ({
                restaurant_id: restaurantId,
                category_id: id,
              })),
              { onConflict: "restaurant_id,category_id" }
            );
          }
        } catch (catErr) {
          console.error("[맛집 등록] 카테고리 처리 실패:", catErr);
        }
      }

      // 이미지 업로드
      if (imageFiles.length > 0) {
        console.log("[맛집 등록] 이미지 업로드 시작:", imageFiles.length, "개");
        const bucket = "restaurant-images";

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const ext = file.name?.split(".")?.pop()?.toLowerCase() || "jpg";
            const randomUuid =
              globalThis.crypto?.randomUUID?.() ||
              Math.random().toString(36).slice(2);
            const uniqueKey = `${randomUuid}_${Date.now()}_${i}`;
            const filePath = `restaurants/${restaurantId}/${uniqueKey}.${ext}`;

            console.log(
              "[맛집 등록] 이미지 업로드:",
              file.name,
              "->",
              filePath
            );

            const { error: uploadErr } = await supabase.storage
              .from(bucket)
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type || "application/octet-stream",
              });

            if (uploadErr) {
              console.error("[맛집 등록] 이미지 업로드 실패:", uploadErr);
              toast.error(`이미지 업로드 실패: ${file.name}`);
              continue;
            }

            const { data: signedData } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            const imageUrl =
              signedData?.signedUrl ||
              supabase.storage.from(bucket).getPublicUrl(filePath).data
                .publicUrl;

            await supabase.from("restaurant_images").insert({
              restaurant_id: restaurantId,
              url: imageUrl,
              sort_order: i,
            });

            console.log("[맛집 등록] 이미지 저장 완료:", imageUrl);
          } catch (imgErr) {
            console.error("[맛집 등록] 이미지 처리 실패:", imgErr);
            toast.error(`이미지 처리 실패: ${file.name}`);
          }
        }
      }

      toast.success(
        isEditing ? "맛집 정보를 수정했습니다!" : "맛집이 등록되었습니다!"
      );
      console.log("[맛집 등록] 완료!");
      onSaved?.(restaurantId);
      onClose?.();
    } catch (err) {
      console.error("[맛집 등록] 전체 오류:", err);
      toast.error(err.message || "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
      console.log("[맛집 등록] 종료");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center px-10 pt-16 pb-10 z-50">
      <ModalBlur onClick={onClose} />
      <div
        className="relative z-50 w-[1200px] h-[100%] pl-10 pr-20 pt-20 pb-10 bg-white rounded-[82px] shadow-[0px_0px_5px_10px_rgba(0,0,0,0.04)] overflow-y-auto box-border"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="모달 닫기"
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 text-2xl leading-none flex items-center justify-center"
        >
          ×
        </button>
        <p className="text-2xl font-bold mb-6 ml-4">맛집 등록</p>
        {/* 단일 폼: step에 따라 섹션을 전환 */}
        <form
          onSubmit={handleSubmit}
          className="text-black text-xl font-semibold"
        >
          {step === 1 && (
            <div>
              <div className="flex gap-10">
                <div className="grid grid-cols-2 gap-16 items-start">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start ">
                      <label
                        htmlFor=""
                        className="mr-6 w-24 flex-shrink-0 text-right "
                      >
                        주소
                      </label>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            className={
                              inputstyle + " flex-1 placeholder:text-[18px]"
                            }
                            type="text"
                            value={address}
                            placeholder="기본 주소"
                            readOnly
                          />
                          <button
                            type="button"
                            onClick={handleAddressSearch}
                            className="px-4 py-1 bg-sub text-white rounded-full hover:bg-red-500 transition-colors text-[16px] font-semibold"
                          >
                            주소 검색
                          </button>
                        </div>

                        <input
                          id="detail-address"
                          className={inputstyle + "placeholder:text-[18px]"}
                          type="text"
                          value={detailAddress}
                          onChange={(e) => setDetailAddress(e.target.value)}
                          placeholder="상세 주소"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label
                        htmlFor=""
                        className="mr-6 w-24 flex-shrink-0 text-right"
                      >
                        가게명
                      </label>
                      <input
                        className={inputstyle + " flex-1"}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center">
                      <label
                        htmlFor=""
                        className="mr-6 w-24 flex-shrink-0 text-right"
                      >
                        전화번호
                      </label>
                      <div className="flex gap-2">
                        <input
                          className={inputstyle}
                          type="text"
                          maxLength={4}
                          value={phoneA}
                          onChange={(e) =>
                            setPhoneA(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                        />
                        <span>-</span>
                        <input
                          className={inputstyle}
                          type="text"
                          maxLength="4"
                          value={phoneB}
                          onChange={(e) =>
                            setPhoneB(e.target.value.replace(/\D/g, ""))
                          }
                        />
                        <span>-</span>
                        <input
                          className={inputstyle}
                          type="text"
                          maxLength="4"
                          value={phoneC}
                          onChange={(e) =>
                            setPhoneC(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-start">
                      <label
                        htmlFor=""
                        className="mr-6 w-24 flex-shrink-0 text-right pt-2"
                      >
                        영업시간
                      </label>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4 relative">
                          <div
                            className={`text-center text-[16px] p-2 cursor-pointer transition-colors ${
                              timeMode === "everyday"
                                ? "text-black font-semibold"
                                : "text-gray-400"
                            }`}
                            onClick={() => setTimeMode("everyday")}
                          >
                            매일 같은 시간 영업
                          </div>
                          <div
                            className={`text-center text-[16px] p-2 cursor-pointer transition-colors ${
                              timeMode === "daybyday"
                                ? "text-black font-semibold"
                                : "text-gray-400"
                            }`}
                            onClick={() => setTimeMode("daybyday")}
                          >
                            요일별로 다른 시간에 영업
                          </div>
                          {/* 애니메이션 바 */}
                          <div
                            className="absolute bottom-0 h-1 bg-sub transition-all duration-300 ease-in-out"
                            style={{
                              left: timeMode === "everyday" ? "0%" : "50%",
                              width: "calc(50% - 8px)",
                              marginLeft: timeMode === "everyday" ? "0" : "8px",
                            }}
                          />
                        </div>
                        {timeMode === "everyday" && (
                          <div id="everydaysame">
                            <div className="flex justify-end mb-2 mr-2">
                              <span className="text-black text-sm font-medium mr-2 ">
                                24시간
                              </span>
                              <input
                                type="checkbox"
                                className="accent-sub outline-none"
                                checked={is24Hours}
                                onChange={(e) => {
                                  setIs24Hours(e.target.checked);
                                  if (e.target.checked) {
                                    setStartHour("00");
                                    setStartMinute("00");
                                    setEndHour("24");
                                    setEndMinute("00");
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[16px]">
                              <span className="flex-shrink-0">시작</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="23"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                                disabled={is24Hours}
                              />
                              <span>:</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="59"
                                value={startMinute}
                                onChange={(e) => setStartMinute(e.target.value)}
                                disabled={is24Hours}
                              />
                              <span className="mx-2">~</span>
                              <span className="flex-shrink-0">종료</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="24"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                                disabled={is24Hours}
                              />
                              <span>:</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="59"
                                value={endMinute}
                                onChange={(e) => setEndMinute(e.target.value)}
                                disabled={is24Hours}
                              />
                            </div>
                            <div className="flex py-4 items-center cursor-pointer">
                              <p className=" pr-4 text-black text-base font-semibold">
                                브레이크타임 추가{" "}
                              </p>
                              <Addtime />
                            </div>
                          </div>
                        )}
                        {timeMode === "daybyday" && (
                          <div id="daybyday" className="text-base">
                            <div className="grid grid-cols-7 text-center mb-2 relative">
                              {["월", "화", "수", "목", "금", "토", "일"].map(
                                (day, index) => (
                                  <div
                                    key={day}
                                    className={`p-2 cursor-pointer transition-colors ${
                                      selectedDay === index
                                        ? "text-black font-semibold"
                                        : "text-gray-400"
                                    }`}
                                    onClick={() => setSelectedDay(index)}
                                  >
                                    {day}
                                  </div>
                                )
                              )}
                              {/* 애니메이션 바 */}
                              <div
                                className="absolute bottom-0 h-1 bg-sub transition-all duration-300 ease-in-out"
                                style={{
                                  left: `${(selectedDay / 7) * 100}%`,
                                  width: "calc(14.28% - 4px)",
                                  marginLeft: "2px",
                                }}
                              />
                            </div>
                            <div className="flex justify-end mb-2 mr-2">
                              <span className="text-black text-sm font-medium mr-2">
                                휴무일
                              </span>
                              <input
                                type="checkbox"
                                className="accent-sub outline-none mr-4"
                                checked={daySchedules[selectedDay].isClosed}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    updateDayScheduleMany(selectedDay, {
                                      isClosed: true,
                                      is24Hours: false,
                                      startHour: "",
                                      startMinute: "",
                                      endHour: "",
                                      endMinute: "",
                                    });
                                  } else {
                                    updateDayScheduleMany(selectedDay, {
                                      isClosed: false,
                                    });
                                  }
                                }}
                              />
                              <span className="text-black text-sm font-medium mr-2">
                                24시간
                              </span>
                              <input
                                type="checkbox"
                                className="accent-sub outline-none"
                                checked={daySchedules[selectedDay].is24Hours}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    updateDayScheduleMany(selectedDay, {
                                      is24Hours: true,
                                      isClosed: false,
                                      startHour: "00",
                                      startMinute: "00",
                                      endHour: "24",
                                      endMinute: "00",
                                    });
                                  } else {
                                    updateDayScheduleMany(selectedDay, {
                                      is24Hours: false,
                                    });
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[16px]">
                              <span className="flex-shrink-0">시작</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="23"
                                value={daySchedules[selectedDay].startHour}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    selectedDay,
                                    "startHour",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  daySchedules[selectedDay].isClosed ||
                                  daySchedules[selectedDay].is24Hours
                                }
                              />
                              <span>:</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="59"
                                value={daySchedules[selectedDay].startMinute}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    selectedDay,
                                    "startMinute",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  daySchedules[selectedDay].isClosed ||
                                  daySchedules[selectedDay].is24Hours
                                }
                              />
                              <span className="mx-2">~</span>
                              <span className="flex-shrink-0">종료</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="24"
                                value={daySchedules[selectedDay].endHour}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    selectedDay,
                                    "endHour",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  daySchedules[selectedDay].isClosed ||
                                  daySchedules[selectedDay].is24Hours
                                }
                              />
                              <span>:</span>
                              <input
                                type="number"
                                className={timeinput}
                                placeholder="00"
                                min="0"
                                max="59"
                                value={daySchedules[selectedDay].endMinute}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    selectedDay,
                                    "endMinute",
                                    e.target.value
                                  )
                                }
                                disabled={
                                  daySchedules[selectedDay].isClosed ||
                                  daySchedules[selectedDay].is24Hours
                                }
                              />
                            </div>
                            <div className="flex py-4 items-center cursor-pointer">
                              <p className=" pr-4 text-black text-base font-semibold">
                                브레이크타임 추가{" "}
                              </p>
                              <Addtime />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label
                        htmlFor=""
                        className="mr-6 w-24 flex-shrink-0 text-right"
                      >
                        카테고리
                      </label>
                      <input
                        type="text"
                        className={inputstyle + " w-[100%]"}
                        placeholder="카테고리를 입력하세요. (쉼표 또는 공백으로 구분)"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-[100%] h-[100%] flex flex-col justify-center">
                    <p className="mb-4">가게 대표 이미지 등록</p>
                    <div className="bg-rose-200 rounded-[20px] min-h-[220px] border-box flex flex-col items-center justify-center p-4 gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <AddImage />
                        <span className="text-base font-medium">
                          이미지 선택 (최대 5MB, 복수 선택 가능)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                      </label>
                      {imagePreviews?.length > 0 && (
                        <div className="w-full grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {imagePreviews.map((src, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => handleRemoveImageAt(idx)}
                              title="클릭하면 삭제"
                              className="group relative w-full aspect-square rounded-xl overflow-hidden bg-white/50 focus:outline-none"
                            >
                              <img
                                src={src}
                                alt={`preview-${idx}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold">
                                삭제
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-44 h-16 px-10 py-4 bg-red-400 rounded-3xl text-white text-3xl font-semibold mt-12"
                >
                  다음
                </button>
              </div>
            </div>
          )}
          {/* STEP 2 */}
          {step === 2 && (
            <div className="grid grid-cols-2" id="additional-info">
              <div>
                <table>
                  <tbody>
                    <tr>
                      <td className="">
                        <p className="p-4 mr-24">포장이 가능한 식당인가요?</p>
                      </td>
                      <td>
                        <CheckBox
                          checked={hasTakeout}
                          onChange={(e) =>
                            setHasTakeout(!!(e?.target?.checked ?? e))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="p-4">배달이 가능한 식당인가요?</p>
                      </td>
                      <td>
                        <CheckBox
                          checked={hasDelivery}
                          onChange={(e) =>
                            setHasDelivery(!!(e?.target?.checked ?? e))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="p-4">예약이 가능한 식당인가요?</p>
                      </td>
                      <td>
                        <CheckBox
                          checked={hasReservation}
                          onChange={(e) =>
                            setHasReservation(!!(e?.target?.checked ?? e))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="p-4">주차공간이 있나요?</p>
                      </td>
                      <td>
                        <CheckBox
                          checked={hasParking}
                          onChange={(e) =>
                            setHasParking(!!(e?.target?.checked ?? e))
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p className="p-4">와이파이가 있나요?</p>
                      </td>
                      <td>
                        <CheckBox
                          checked={hasWifi}
                          onChange={(e) =>
                            setHasWifi(!!(e?.target?.checked ?? e))
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <div className="flex items-center mb-6">
                  <p className="mr-6">마커에 들어갈 이모지를 입력해주세요.</p>
                  <input
                    type="text"
                    className="p-1 bg-gray-100 rounded-xl w-[39%]"
                    value={markerEmoji}
                    onChange={(e) => setMarkerEmoji(e.target.value)}
                  />
                </div>
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="mb-4">나의 마커 미리보기</p>
                  <div className="relative">
                    <Marker />
                    <div className="text-5xl absolute top-7 left-0 w-[113px] h-[113px]">
                      <div className="flex items-center justify-center">
                        {markerEmoji}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-2 mt-8">
                <p className="p-4">맛집 한줄평을 작성해주세요.</p>
                <input
                  type="text"
                  className="p-1 ml-4 bg-gray-100 rounded-xl w-[100%]"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex justify-between mt-6 pr-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-44 h-16 px-10 py-4 bg-gray-300 hover:bg-gray-400 rounded-3xl text-white text-3xl font-semibold"
                >
                  뒤로
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-44 h-16 px-10 py-4 bg-red-400 rounded-3xl text-white text-3xl font-semibold disabled:opacity-60"
                >
                  {submitting
                    ? isEditing
                      ? "수정중..."
                      : "등록중..."
                    : isEditing
                    ? "수정"
                    : "등록"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

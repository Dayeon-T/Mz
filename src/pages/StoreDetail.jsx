import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRestaurantDetail } from "../api/restaurants";
import MzSvg from "../assets/mz맛집.svg?react";
import AddMarker from "../assets/mdi_address-marker.svg?react";
import Phone from "../assets/entypo_old-phone.svg?react";
import Parking from "../assets/parking.svg?react";
import Timer from "../assets/time.svg?react";
import Wifi from "../assets/wifi.svg?react";
import Pojang from "../assets/eat.svg?react";
import Etc from "../assets/etc.svg?react";
import Bookmark from "../assets/bookmark.svg?react";
import KakaoMap from "../components/KakaoMap";

const formatTime = (timeString) => {
  if (!timeString) return null;
  const [hh = "", mm = ""] = String(timeString).split(":");
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
};

const formatVisitDateLabel = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("ko-KR");
};

const clamp5 = (value) => Math.max(0, Math.min(5, Number(value) || 0));

const percentFromRating = (rating) => (clamp5(rating) / 5) * 100;

const makeClipId = (suffix) => `star-clip-${String(suffix ?? "default")}`;

function StarSvg({
  idSuffix,
  rating = 0,
  width = 300,
  height = 67,
  ariaLabel, // 생략 시 자동 생성
}) {
  const clamped = clamp5(rating);
  const widthPercent = percentFromRating(clamped);
  const clipId = makeClipId(idSuffix);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 184 37"
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-label={ariaLabel ?? `별점 ${clamped}점 (최대 5점)`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
          <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
          <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
          <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
          <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z" />
        </clipPath>
      </defs>

      {/* 회색 아웃라인 */}
      <g fill="#E5E7EB">
        <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
        <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
        <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
        <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
        <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z" />
      </g>

      {/* 채워지는 영역 */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="0"
          y="0"
          width={`${widthPercent}%`}
          height="100%"
          fill="#FF6C6F"
        />
      </g>
    </svg>
  );
}

/** 🔢 숫자 평점만 */
export function RatingValue({
  rating = 0,
  digits = 1,
  className = "ml-2 text-[18px] font-normal text-black",
}) {
  const clamped = clamp5(rating);
  return <span className={className}>{clamped.toFixed(digits)}</span>;
}

/** (n) 리뷰 개수만 */
export function ReviewCount({ count = 0, className = "ml-2" }) {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (safeCount <= 0) return null;
  return <span className={className}>{safeCount}</span>;
}

function SvgStarBar({ idSuffix, rating = 0, reviewCount = 0 }) {
  const clamped = Math.max(0, Math.min(5, Number(rating) || 0));
  const widthPercent = (clamped / 5) * 100;
  const clipId = `stars-clip-${String(idSuffix).replace(/\s+/g, "-")}`;
  const safeCount = Number.isFinite(reviewCount)
    ? Math.max(0, Math.floor(reviewCount))
    : 0;
  const showCount = safeCount > 0;
  return (
    <div className="flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 184 37"
        style={{ width: "170px", height: "38px" }}
        aria-label={`별점 ${clamped}점 (최대 5점)`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
            <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
            <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
            <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
            <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z" />
          </clipPath>
        </defs>
        <g fill="#E5E7EB">
          <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
          <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
          <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
          <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
          <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z" />
        </g>
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="0"
            y="0"
            width={`${widthPercent}%`}
            height="100%"
            fill="#FF6C6F"
          />
        </g>
      </svg>
      <span className="ml-2 text-[18px] font-normal text-black">
        {clamped.toFixed(1)}
      </span>
      {showCount && <span className="ml-2 ">({safeCount})</span>}
    </div>
  );
}

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const PAGE_SIZE = 5;
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const dragStartXRef = useRef(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) {
        setError("가게 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchRestaurantDetail(id);
        if (active) {
          if (!detail) {
            setError("등록된 가게가 없습니다.");
            setRestaurant(null);
          } else {
            setRestaurant(detail);
          }
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "가게 정보를 불러오지 못했습니다.");
          setRestaurant(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const images = useMemo(() => {
    if (!restaurant) return [];
    if (Array.isArray(restaurant.images) && restaurant.images.length > 0) {
      return restaurant.images;
    }
    return restaurant.image ? [restaurant.image] : [];
  }, [restaurant]);

  useEffect(() => {
    setPageIndex(0);
  }, [images.length]);

  const slides = useMemo(() => {
    if (images.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < images.length; i += PAGE_SIZE) {
      const chunk = images.slice(i, i + PAGE_SIZE).map((src, idx) => ({
        src,
        actualIndex: i + idx,
      }));
      chunks.push(chunk);
    }
    return chunks;
  }, [images]);

  const mapRestaurants = useMemo(() => {
    if (!restaurant) return [];
    return [restaurant];
  }, [restaurant]);

  const totalPages = useMemo(() => slides.length, [slides]);

  useEffect(() => {
    if (totalPages === 0) {
      if (pageIndex !== 0) {
        setPageIndex(0);
      }
    } else if (pageIndex > totalPages - 1) {
      setPageIndex(totalPages - 1);
    }
  }, [pageIndex, totalPages]);

  const dragPercent = (() => {
    const sliderWidth = sliderRef.current?.clientWidth || 1;
    return sliderWidth ? (dragDelta / sliderWidth) * 100 : 0;
  })();

  const handlePointerDown = (event) => {
    if (totalPages <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = event.clientX;
    setDragDelta(0);
    try {
      sliderRef.current?.setPointerCapture(event.pointerId);
    } catch {}
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    event.preventDefault();
    const delta = event.clientX - dragStartXRef.current;
    setDragDelta(delta);
  };

  const finalizeDrag = (event) => {
    if (!isDragging) return;
    try {
      sliderRef.current?.releasePointerCapture(event.pointerId);
    } catch {}
    const sliderWidth = sliderRef.current?.clientWidth || 1;
    const threshold = sliderWidth * 0.15;
    setPageIndex((prev) => {
      if (totalPages <= 1) return prev;
      let nextIndex = prev;
      if (dragDelta > threshold) {
        nextIndex = Math.max(0, prev - 1);
      } else if (dragDelta < -threshold) {
        nextIndex = Math.min(totalPages - 1, prev + 1);
      }
      return nextIndex;
    });
    setDragDelta(0);
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary text-gray-500">
        가게 정보를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
        <p className="text-lg text-red-500 font-semibold mb-2">{error}</p>
        <button
          type="button"
          className="mt-2 px-6 py-3 bg-sub text-white rounded-full text-sm font-semibold"
          onClick={() => navigate(-1)}
        >
          돌아가기
        </button>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const openTime = formatTime(restaurant.open_time);
  const closeTime = formatTime(restaurant.close_time);
  const breakStart = formatTime(restaurant.break_start);
  const breakEnd = formatTime(restaurant.break_end);
  const recommendedBy = restaurant.recommended_by || null;
  const recommendedNickname =
    (recommendedBy?.nickname && String(recommendedBy.nickname)) || "익명";
  const recommendedAvatar = recommendedBy?.avatar_url || null;
  const tagline =
    typeof restaurant.tagline === "string" ? restaurant.tagline.trim() : "";
  const reviewPhotos = Array.isArray(restaurant.review_photos)
    ? restaurant.review_photos
    : [];
  const reviews = Array.isArray(restaurant.reviews) ? restaurant.reviews : [];

  const handleWriteReview = () => {
    if (!restaurant?.id) return;
    navigate(`/store/${restaurant.id}/review`);
  };

  return (
    <div className="min-h-screen bg-primary px-10 py-10">
      <div className="w-[418px] pr-[197px]">
        <Link to="/" aria-label="홈으로 이동">
          <MzSvg className="cursor-pointer" />
        </Link>
      </div>
      <div className="bg-white px-20 pt-14 rounded-[40px] mt-4 flex justify-center">
        <div className="w-[70%]">
          {/* <div className="flex items-center justify-between mb-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-sm font-semibold"
            >
              ← 뒤로가기
            </button>
            <Link
              to="/"
              className="px-5 py-2 rounded-full bg-red-400 text-white text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              홈으로 이동
            </Link>
          </div> */}
          <h1 className="text-black text-3xl font-semibold">가게 정보</h1>
          <div className="h-2 border-b-2 border-red-200/70 mt-2 mb-8"></div>
          <section className="flex flex-col gap-10">
            {totalPages > 0 && (
              <div className="flex flex-col gap-4">
                <div
                  ref={sliderRef}
                  className="relative overflow-hidden cursor-grab active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finalizeDrag}
                  onPointerCancel={finalizeDrag}
                  onPointerLeave={finalizeDrag}
                >
                  <div
                    className="flex"
                    style={{
                      transform: `translateX(${
                        -(pageIndex * 100) + dragPercent
                      }%)`,
                      transition: isDragging ? "none" : "transform 0.4s ease",
                    }}
                  >
                    {slides.map((slide, slideIdx) => (
                      <div
                        key={`${restaurant.id}-slide-${slideIdx}`}
                        className="min-w-full"
                      >
                        <div className="grid grid-cols-5">
                          {slide.map(({ src, actualIndex }) => (
                            <div
                              key={`${restaurant.id}-image-${actualIndex}`}
                              className="w-full h-56 overflow-hidden bg-search-bg"
                            >
                              <img
                                src={src}
                                alt={`${restaurant.name} 이미지 ${
                                  actualIndex + 1
                                }`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-2">
                    {slides.map((_, idx) => (
                      <button
                        key={`${restaurant.id}-indicator-${idx}`}
                        type="button"
                        onClick={() => {
                          setPageIndex(idx);
                          setDragDelta(0);
                        }}
                        className={`w-3 h-3 rounded-full transition-all ${
                          pageIndex === idx
                            ? "bg-red-400 scale-100"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                        aria-label={`${idx + 1}번째 이미지 묶음 보기`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <header>
              <div className="grid grid-cols-1">
                <div className="flex items-center">
                  <h1 className="mr-8 text-4xl font-bold text-black">
                    {restaurant.name}
                  </h1>
                  <SvgStarBar
                    idSuffix={`${restaurant.id}-summary`}
                    rating={restaurant.rating}
                    reviewCount={restaurant.review_count}
                  />
                </div>
                <div className="flex items-center justify-center"></div>
              </div>
            </header>
            <div className="grid grid-cols-2">
              <div className="text-black text-xl font-medium flex flex-col gap-4">
                <p className="flex gap-2">
                  <AddMarker />
                  {restaurant.address}
                </p>
                <p className="flex gap-2">
                  <Phone />
                  {restaurant.phone}
                </p>
                <p className="flex gap-2">
                  <Timer />
                  <span
                    className={` ${
                      restaurant.is_open ? "text-red-400" : " text-gray-700"
                    }`}
                  >
                    {restaurant.is_open ? "영업중" : "영업종료"}
                  </span>
                </p>
                <div className="flex gap-4">
                  <Pojang />
                  <p className="flex gap-2">
                    <span>포장</span>
                    {restaurant.has_takeout ? "O" : "X"}
                  </p>

                  <p className="flex gap-2">
                    <span>배달</span>
                    {restaurant.has_delivery ? "O" : "X"}
                  </p>
                  <p className="flex gap-2">
                    <span>예약</span>
                    {restaurant.has_reservation ? "O" : "X"}
                  </p>
                </div>
                <p className="flex gap-2">
                  <Parking />
                  {restaurant.has_parking ? "O" : "X"}
                </p>
                <p className="flex gap-2">
                  <Wifi />
                  {restaurant.has_wifi ? "O" : "X"}
                </p>
              </div>
              <div className="flex justify-between">
                <Bookmark />
                <div className="w-[90%] h-[100%] rounded-[40px] overflow-hidden">
                  <KakaoMap
                    restaurants={mapRestaurants}
                    activeRestaurantId={restaurant.id}
                    showOverlay={false}
                    className="relative z-0 w-full h-full overflow-hidden"
                    style={{ minHeight: "0", height: "100%" }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-end gap-3 justify-end mb-8">
              {(recommendedBy || tagline) && (
                <>
                  <div className="flex items-end justify-end  gap-3 text-right">
                    {recommendedBy ? (
                      <>
                        <div className="flex flex-col items-end gap-1 justify-end  ">
                          <p className="text-xl">
                            <span className="text-text font-bold">
                              {recommendedNickname}
                            </span>{" "}
                            님이 추천했어요
                          </p>
                        </div>

                        {recommendedAvatar ? (
                          <img
                            src={recommendedAvatar}
                            alt={`${recommendedNickname} 프로필`}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                            {recommendedNickname.substring(0, 1)}
                          </div>
                        )}
                      </>
                    ) : (
                      tagline && (
                        <div>
                          <p className="font-medium text-black">{tagline}</p>
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    {tagline && (
                      <p className="h-12 px-6 bg-rose-200 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl inline-flex justify-end items-center gap-2.5">
                        <span className="text-black text-xl font-medium">
                          {tagline}
                        </span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
          <section className="mt-20">
            <div className="flex items-center justify-between">
              <h1 className="text-black text-3xl font-semibold">방문자 리뷰</h1>
            </div>
            <div className="h-2 border-b-2 border-red-200/70 mt-2 mb-8"></div>
            <div className="flex items-center justify-center mt-4">
              <div>
                <div className="flex flex-col items-center gap-4">
                  <RatingValue
                    rating={restaurant.rating}
                    digits={1}
                    className="text-black text-5xl font-semibold "
                  />
                  <StarSvg
                    idSuffix={`${restaurant.id}-reviews`}
                    rating={restaurant.rating}
                  />
                  <div className="flex items-center jsutify-center">
                    <ReviewCount
                      count={restaurant.review_count}
                      className="text-red-400 text-2xl font-black"
                    />
                    <p className="text-black text-2xl font-medium">
                      &nbsp; 명이 리뷰를 남겼어요
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleWriteReview}
                    className="mb-10 w-36 h-14 p-2 bg-red-400 rounded-[20px] inline-flex justify-center items-center gap-2.5 transition-colors hover:bg-red-500"
                  >
                    <div className="justify-start text-white text-2xl font-semibold">
                      리뷰 작성
                    </div>
                  </button>
                </div>
                <div className="flex items-center gap-3"></div>
              </div>
            </div>
            <div>
              {restaurant.review_count === 0 ? (
                <p className="mt-4 text-gray-500">등록된 리뷰가 없습니다.</p>
              ) : (
                <div className="mt-6 flex flex-col gap-6">
                  {reviews.length > 0 && (
                    <div className="flex flex-col gap-5">
                      {reviews.slice(0, 2).map((rev) => (
                        <article
                          key={rev.id}
                          className="rounded-3xl bg-[#FFF6F4] px-6 py-5"
                        >
                          <div className="flex items-center gap-4">
                            {rev.author?.avatar_url ? (
                              <img
                                src={rev.author.avatar_url}
                                alt={`${rev.author?.nickname || "익명"} 프로필`}
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                                {(rev.author?.nickname || "?").substring(0, 1)}
                              </div>
                            )}
                            <div>
                              <p className="text-lg font-semibold text-black">
                                {rev.author?.nickname || "익명"}
                              </p>
                              <p className="text-sm text-gray-500">
                                방문일 &nbsp;&nbsp;&nbsp;
                                {formatVisitDateLabel(rev.visit_date) ||
                                  "최근 방문"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {rev.images && rev.images.length > 0 ? (
                              <div className="grid grid-cols-4 gap-4 mb-8">
                                {rev.images.slice(0, 4).map((src, idx) => (
                                  <div
                                    key={`${restaurant.id}-review-photo-${idx}`}
                                    className="  mt-2 h-48 rounded-3xl overflow-hidden bg-gray-100"
                                  >
                                    <img
                                      src={src}
                                      alt={`${restaurant.name} 리뷰 사진 ${
                                        idx + 1
                                      }`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="py-4 text-gray-500">
                                등록된 리뷰 사진이 없습니다.
                              </p>
                            )}
                          </div>
                          <SvgStarBar
                            idSuffix={`${rev.id}-rating`}
                            rating={rev.rating}
                            reviewCount={0}
                          />
                          {rev.text && (
                            <p className="mt-3 text-black text-2xl font-normal">
                              {rev.text}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

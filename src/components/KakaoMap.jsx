import { useEffect, useRef, useState } from "react";
import markerSvgUrl from "../assets/marker.svg?url";

let kakaoLoaderPromise = null;

async function loadKakaoMaps() {
  if (window.kakao?.maps?.load) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoLoaderPromise) {
    return kakaoLoaderPromise;
  }

  const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error(
        "[KakaoMap] VITE_KAKAO_MAP_API_KEY가 설정되어 있지 않습니다. .env를 확인하세요."
      )
    );
  }

  kakaoLoaderPromise = new Promise((resolve, reject) => {
    const finalize = () => {
      if (!window.kakao?.maps?.load) {
        kakaoLoaderPromise = null;
        reject(
          new Error(
            "[KakaoMap] kakao.maps.load가 준비되지 않았습니다. JavaScript 키와 도메인을 확인하세요."
          )
        );
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    const existing = document.querySelector('script[data-kakao-sdk="maps"]');
    if (existing) {
      if (window.kakao?.maps?.load) {
        finalize();
        return;
      }
      existing.addEventListener("load", finalize, { once: true });
      existing.addEventListener(
        "error",
        () => {
          kakaoLoaderPromise = null;
          reject(
            new Error(
              "[KakaoMap] 카카오 지도 SDK 로드에 실패했습니다. 네트워크와 도메인 허용을 확인하세요."
            )
          );
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.kakaoSdk = "maps";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;

    script.addEventListener("load", finalize, { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        kakaoLoaderPromise = null;
        reject(
          new Error(
            "[KakaoMap] 카카오 지도 SDK 스크립트를 불러오지 못했습니다."
          )
        );
      },
      { once: true }
    );

    document.head.appendChild(script);
  });

  return kakaoLoaderPromise;
}

function formatCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return '<span style="color: #999; font-size: 12px;">카테고리 미분류</span>';
  }
  return categories
    .map(
      (category) =>
        `<span style="color: #E7673C; font-size: 18px; font-weight: 600; display: inline-block; margin-left:10px;">#${category}</span>`
    )
    .join("");
}

function buildOverlayContent(restaurant) {
  const clipId = `stars-clip-${restaurant.id}`;
  const rating = Number.isFinite(restaurant.rating)
    ? Math.max(0, Math.min(5, Number(restaurant.rating)))
    : 0;
  const filledWidth = ((rating / 5) * 184).toFixed(1);
  const ratingLabel = rating ? rating.toFixed(1) : "0.0";
  const markerEmoji = restaurant.marker_emoji || "";
  const detailUrl = restaurant.id ? `/store/${restaurant.id}` : "#";

  const container = document.createElement("div");
  container.innerHTML = `
    <div style="position: relative;">
      <div style="width: 500px;
                 border-radius: 20px;
                 background: #FFF;
                 padding: 30px;
                 box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                 position: relative;
                 z-index: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <a href="${detailUrl}" style="color: inherit; text-decoration: none;">
            <p style="color: #000;
                     font-size: 26px;
                     font-weight: 600;
                     margin: 0;">${restaurant.name ?? "이름 미상"}</p>
          </a>
          <button type="button" data-overlay-close="true"
                  style="font-size: 22px; border: none; background: transparent; cursor: pointer; color: #999; flex-shrink: 0;">×</button>
        </div>
        <div style="display: flex; gap: 20px; align-items: flex-start;">
          <div style="width: 120px;
                      height: 120px;
                      flex-shrink: 0;
                       border-radius: 22px;
                       background: lightgray;
                       overflow: hidden;">
            ${
              restaurant.image
                ? `<a href="${detailUrl}" style="display: block; width: 100%; height: 100%;">
                    <img src="${
                      restaurant.image
                    }" style="width: 100%; height: 100%; object-fit: cover;" alt="${
                    restaurant.name ?? ""
                  }">
                  </a>`
                : `<a href="${detailUrl}" style="display: block; width: 100%; height: 100%; text-decoration: none;">
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f4f4f4;">
                      <div style="width: 72px; height: 72px; border-radius: 50%; background: #FFF; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                        ${markerEmoji || "🍽️"}
                      </div>
                    </div>
                  </a>`
            }
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0;">
            <div>
              <a href="${detailUrl}" style="display: inline-flex; flex-direction: column; gap: 4px; text-decoration: none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184 37" style="width: 160px; height: auto; pointer-events: none;">
                <defs>
                  <clipPath id="${clipId}">
                    <rect x="0" y="0" width="${filledWidth}" height="37" />
                  </clipPath>
                </defs>
                <g fill="#E2E2E2">
                  <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33217 32.2272 8.27768 31.4611 8.57698 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.3954 14.5922C2.61163 14.0228 3.01437 12.7832 3.98306 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
                  <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
                  <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
                  <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
                  <path d="M165.549 2.92705C165.848 2.00574 167.152 2.00574 167.451 2.92705L170.429 12.0922C170.563 12.5042 170.947 12.7832 171.38 12.7832H181.017C181.986 12.7832 182.388 14.0228 181.605 14.5922L173.808 20.2566C173.458 20.5112 173.311 20.9626 173.445 21.3746L176.423 30.5398C176.722 31.4611 175.668 32.2272 174.884 31.6578L167.088 25.9934C166.737 25.7388 166.263 25.7388 165.912 25.9934L158.116 31.6578C157.332 32.2272 156.278 31.4611 156.577 30.5398L159.555 21.3746C159.689 20.9626 159.542 20.5112 159.192 20.2566L151.395 14.5922C150.612 14.0228 151.014 12.7832 151.983 12.7832H161.62C162.053 12.7832 162.437 12.5042 162.571 12.0922L165.549 2.92705Z" />
                </g>
                <g clip-path="url(#${clipId})" fill="#FF6C6F">
                  <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33217 32.2272 8.27768 31.4611 8.57698 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.3954 14.5922C2.61163 14.0228 3.01437 12.7832 3.98306 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z" />
                  <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z" />
                  <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z" />
                  <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z" />
                  <path d="M165.549 2.92705C165.848 2.00574 167.152 2.00574 167.451 2.92705L170.429 12.0922C170.563 12.5042 170.947 12.7832 171.38 12.7832H181.017C181.986 12.7832 182.388 14.0228 181.605 14.5922L173.808 20.2566C173.458 20.5112 173.311 20.9626 173.445 21.3746L176.423 30.5398C176.722 31.4611 175.668 32.2272 174.884 31.6578L167.088 25.9934C166.737 25.7388 166.263 25.7388 165.912 25.9934L158.116 31.6578C157.332 32.2272 156.278 31.4611 156.577 30.5398L159.555 21.3746C159.689 20.9626 159.542 20.5112 159.192 20.2566L151.395 14.5922C150.612 14.0228 151.014 12.7832 151.983 12.7832H161.62C162.053 12.7832 162.437 12.5042 162.571 12.0922L165.549 2.92705Z" />
                </g>
              </svg>
                <div style="font-size: 16px; font-weight: 600; color: #E7673C;">
                  ${ratingLabel}점 / 5.0
                </div>
              </a>
            </div>
            <p style="color: #6C6C6C; 
                      font-size: 14px; 
                      margin: 0 0 10px 0; 
                      white-space: normal; 
                      word-break: break-word;">
              ${restaurant.address ?? "주소 정보 없음"}
            </p>
            <div style="margin-bottom: 10px;">
              ${formatCategories(restaurant.categories)}
            </div>
            
            <p style="color: #000; 
                      font-size: 15px; 
                      font-weight: 500; 
                      margin: 0; 
                      white-space: normal; 
                      word-break: break-word; 
                      line-height: 1.5;">
              ${restaurant.tagline ?? ""}
            </p>
          </div>
        </div>
      </div>
      <div style="position: absolute; bottom: -14px; left: 50%;
                 transform: translateX(-50%); width: 0; height: 0;
                 border-left: 15px solid transparent;
                 border-right: 15px solid transparent;
                 border-top: 15px solid #FFF;
                 filter: drop-shadow(0 3px 6px rgba(0,0,0,0.1));"></div>
    </div>
  `;

  return container;
}

const radiusToLevel = (radius) => {
  if (!radius || radius <= 0) return 4;
  if (radius <= 500) return 3;
  if (radius <= 1000) return 4;
  if (radius <= 2000) return 5;
  if (radius <= 4000) return 6;
  if (radius <= 8000) return 7;
  return 8;
};

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistanceMeters = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const lat1 = Number(a.lat);
  const lng1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lng2 = Number(b.lng);
  if (
    Number.isNaN(lat1) ||
    Number.isNaN(lng1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lng2)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const aValue =
    sinLat * sinLat +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(aValue), Math.sqrt(1 - aValue));

  return EARTH_RADIUS_METERS * c;
};

const isWithinFocus = (restaurant, center, radius) => {
  if (!center || !radius || radius <= 0) return true;
  if (!restaurant?.lat || !restaurant?.lng) return false;
  return (
    calculateDistanceMeters(
      { lat: restaurant.lat, lng: restaurant.lng },
      center
    ) <= radius
  );
};

export default function KakaoMap({
  restaurants = [],
  activeRestaurantId,
  showOverlay = true,
  className,
  style,
  focusCenter,
  focusRadius = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerMapRef = useRef(new Map());
  const overlayMapRef = useRef(new Map());
  const currentOverlayRef = useRef(null);
  const restaurantMapRef = useRef(new Map());
  const listenersRef = useRef([]);
  const focusCircleRef = useRef(null);
  const lastFocusKeyRef = useRef(null);
  const showOverlayRef = useRef(showOverlay);
  const activeIdRef = useRef(activeRestaurantId);
  const [isMapReady, setIsMapReady] = useState(false);

  const buildMarkerContent = (restaurant) => {
    const emoji = restaurant.marker_emoji?.trim() || "🍽️";

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `${restaurant.name ?? "맛집"} 위치 보기`);
    button.style.cssText =
      "background: none; border: none; padding: 0; cursor: pointer;";

    const markerShell = document.createElement("div");
    markerShell.style.cssText = `
      width: 64px;
      height: 69px;
      background-image: url('${markerSvgUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const emojiCircle = document.createElement("div");
    emojiCircle.style.cssText = `
      position: absolute;
      top: 9px;
      left: 50%;
      transform: translateX(-50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #ffffff;
      border:5px solid #F97E55;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 600;
      color: #1f1f1f;
      box-shadow: 0 6px 6px rgba(0, 0, 0, 0.12);
    `;
    emojiCircle.textContent = emoji;

    markerShell.appendChild(emojiCircle);
    button.appendChild(markerShell);

    return button;
  };

  const hideCurrentOverlay = () => {
    currentOverlayRef.current?.setMap(null);
    currentOverlayRef.current = null;
  };

  const resetArtifacts = () => {
    hideCurrentOverlay();

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    listenersRef.current.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    listenersRef.current = [];

    overlayMapRef.current.forEach((overlay) => overlay.setMap(null));
    overlayMapRef.current.clear();

    restaurantMapRef.current.clear();
  };

  const showOverlayForRestaurant = (restaurant) => {
    if (
      !restaurant ||
      !restaurant.lat ||
      !restaurant.lng ||
      !mapRef.current ||
      !window.kakao?.maps
    ) {
      return;
    }

    let overlay = overlayMapRef.current.get(restaurant.id);
    if (!overlay) {
      const content = buildOverlayContent(restaurant);
      overlay = new window.kakao.maps.CustomOverlay({
        content,
        position: new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng),
        yAnchor: 1.1,
        zIndex: 5,
      });

      const closeButton = content.querySelector("[data-overlay-close]");
      if (closeButton) {
        closeButton.addEventListener("click", () => {
          overlay.setMap(null);
          if (currentOverlayRef.current === overlay) {
            currentOverlayRef.current = null;
          }
        });
      }

      overlayMapRef.current.set(restaurant.id, overlay);
    } else {
      overlay.setPosition(
        new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng)
      );
    }

    hideCurrentOverlay();
    overlay.setMap(mapRef.current);
    currentOverlayRef.current = overlay;

    const position = new window.kakao.maps.LatLng(
      restaurant.lat,
      restaurant.lng
    );

    window.requestAnimationFrame(() => {
      const map = mapRef.current;
      if (!map) return;

      const projection = map.getProjection?.();
      if (projection && projection.containerPointFromCoords) {
        const markerPoint = projection.containerPointFromCoords(position);
        if (markerPoint) {
          const targetPoint = new window.kakao.maps.Point(
            markerPoint.x,
            markerPoint.y - 140
          );
          const targetLatLng =
            projection.coordsFromContainerPoint?.(targetPoint);
          if (targetLatLng) {
            map.panTo(targetLatLng);
            return;
          }
        }
      }

      map.panTo(position);
    });
  };

  useEffect(() => {
    showOverlayRef.current = showOverlay;
    if (!showOverlay) {
      hideCurrentOverlay();
    }
  }, [showOverlay]);

  useEffect(() => {
    activeIdRef.current = activeRestaurantId;
  }, [activeRestaurantId]);

  useEffect(() => {
    let canceled = false;

    loadKakaoMaps()
      .then((kakao) => {
        if (canceled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(containerRef.current, {
            center: new kakao.maps.LatLng(37.4844, 126.9297),
            level: 4,
          });
        }

        setIsMapReady(true);
      })
      .catch((error) => {
        console.error("[KakaoMap] 지도 초기화 실패:", error);
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) {
      return undefined;
    }

    resetArtifacts();

    const baseList = Array.isArray(restaurants) ? restaurants : [];
    const sanitized = baseList
      .map((restaurant) => {
        if (!(restaurant?.id && restaurant.lat && restaurant.lng)) return null;
        const lat = Number(restaurant.lat);
        const lng = Number(restaurant.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { ...restaurant, lat, lng };
      })
      .filter(Boolean);

    restaurantMapRef.current.clear();
    sanitized.forEach((restaurant) => {
      restaurantMapRef.current.set(restaurant.id, restaurant);
    });

    const activeId = activeIdRef.current;

    if (sanitized.length === 0) {
      return undefined;
    }

    const kakao = window.kakao;
    const map = mapRef.current;

    const bounds = new kakao.maps.LatLngBounds();
    let hasValidPosition = false;

    sanitized.forEach((restaurantRaw) => {
      const { lat, lng } = restaurantRaw;
      const position = new kakao.maps.LatLng(lat, lng);
      bounds.extend(position);
      hasValidPosition = true;

      const markerButton = buildMarkerContent(restaurantRaw);

      const markerOverlay = new kakao.maps.CustomOverlay({
        position,
        content: markerButton,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 4,
      });

      markerOverlay.setMap(map);

      markersRef.current.push(markerOverlay);

      const restaurant = restaurantRaw;
      const clickHandler = (event) => {
        event.preventDefault();
        if (!showOverlayRef.current) return;
        showOverlayForRestaurant(restaurant);
      };

      markerButton.addEventListener("click", clickHandler);
      listenersRef.current.push({
        element: markerButton,
        type: "click",
        handler: clickHandler,
      });
    });

    if (
      hasValidPosition &&
      (!focusCenter || !focusRadius || focusRadius <= 0)
    ) {
      if (sanitized.length === 1) {
        const firstMarker = markersRef.current[0];
        if (firstMarker) {
          map.setLevel(3);
          map.setCenter(firstMarker.getPosition());
        }
      } else {
        map.setBounds(bounds, 48, 48, 48, 48);
      }
    }

    const initialActive = activeIdRef.current;
    if (showOverlayRef.current && initialActive) {
      const target = restaurantMapRef.current.get(initialActive);
      if (target) {
        showOverlayForRestaurant(target);
      }
    }

    return () => {
      resetArtifacts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRestaurantId, focusCenter, focusRadius, isMapReady, restaurants]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    if (!showOverlay || !activeRestaurantId) {
      hideCurrentOverlay();
      return;
    }

    const restaurant = restaurantMapRef.current.get(activeRestaurantId);
    if (!restaurant) {
      hideCurrentOverlay();
      return;
    }

    showOverlayForRestaurant(restaurant);
  }, [activeRestaurantId, isMapReady, showOverlay]);

  useEffect(
    () => () => {
      focusCircleRef.current?.setMap(null);
      focusCircleRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!focusCenter) {
      lastFocusKeyRef.current = null;
      return;
    }
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) {
      return;
    }

    const { lat, lng } = focusCenter;
    if (!lat || !lng) return;

    const focusKey = `${lat}:${lng}:${focusRadius ?? 0}`;
    if (lastFocusKeyRef.current === focusKey) {
      return;
    }
    lastFocusKeyRef.current = focusKey;

    const map = mapRef.current;
    const kakao = window.kakao;
    const center = new kakao.maps.LatLng(lat, lng);

    map.relayout?.();
    if (focusRadius && focusRadius > 0) {
      map.setLevel(radiusToLevel(focusRadius));
    }
    map.panTo(center);

    if (focusRadius && focusRadius > 0) {
      if (!focusCircleRef.current) {
        focusCircleRef.current = new kakao.maps.Circle({
          strokeWeight: 2,
          strokeColor: "#F97E55",
          strokeOpacity: 0.9,
          strokeStyle: "solid",
          fillColor: "#F97E55",
          fillOpacity: 0.08,
        });
      }
      focusCircleRef.current.setOptions({
        center,
        radius: focusRadius,
      });
      focusCircleRef.current.setMap(map);
    } else if (focusCircleRef.current) {
      focusCircleRef.current.setMap(null);
    }
  }, [focusCenter, focusRadius, isMapReady]);

  const containerClassName = `${
    className ?? "z-0 w-full h-full overflow-hidden rounded-tl-[40px]"
  } relative`;

  const inlineStyle = style ?? { minHeight: "400px" };

  return (
    <div className={containerClassName} style={inlineStyle}>
      <div ref={containerRef} className="h-full w-full" />
      {!isMapReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-gray-500">
          지도를 불러오는 중입니다...
        </div>
      )}
    </div>
  );
}

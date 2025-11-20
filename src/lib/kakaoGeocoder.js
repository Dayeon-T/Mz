let kakaoServicesPromise = null;

export function ensureKakaoServices() {
  if (window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao.maps.services);
  }
  if (kakaoServicesPromise) return kakaoServicesPromise;

  kakaoServicesPromise = new Promise((resolve, reject) => {
    const finalize = () => {
      const services = window.kakao?.maps?.services;
      if (services) {
        resolve(services);
      } else {
        kakaoServicesPromise = null;
        reject(new Error("카카오 지도 서비스를 초기화할 수 없습니다."));
      }
    };

    const loadSdk = () => {
      if (!window.kakao?.maps?.load) {
        kakaoServicesPromise = null;
        reject(new Error("카카오 지도 SDK 로드에 실패했습니다."));
        return;
      }
      window.kakao.maps.load(finalize);
    };

    if (window.kakao?.maps) {
      loadSdk();
      return;
    }

    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      kakaoServicesPromise = null;
      reject(new Error("카카오 지도 API 키가 설정되어 있지 않습니다."));
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

    const handleLoad = () => {
      cleanup();
      loadSdk();
    };

    const handleError = () => {
      cleanup();
      script?.remove();
      kakaoServicesPromise = null;
      reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
    };

    const cleanup = () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });

  return kakaoServicesPromise;
}

export async function geocodeAddress(address) {
  if (!address?.trim()) return null;
  await ensureKakaoServices();

  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result?.[0]) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
        });
      } else {
        reject(new Error("주소를 좌표로 변환할 수 없습니다."));
      }
    });
  });
}

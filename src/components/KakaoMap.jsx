import { useEffect, useRef } from 'react'


export default function KakaoMap({ restaurants = [] }) {
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const markersRef = useRef([])

  // 1) 카카오 스크립트는 최초 1번만 로드 (실패한 기존 스크립트가 있으면 제거 후 재시도)
  useEffect(() => {
    if (window.kakao?.maps && mapRef.current) return

    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY
    if (!apiKey) {
      console.error('[KakaoMap] VITE_KAKAO_MAP_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.')
      return
    }

    const existing = document.querySelector('script[data-kakao-sdk="maps"]')
    if (existing && !window.kakao?.maps) {
      // 이전 로드 실패로 kakao.maps가 없는 경우 스크립트를 제거하고 재시도
      existing.parentNode?.removeChild(existing)
    } else if (existing) {
      return // 이미 정상 로드됨
    }

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.dataset.kakaoSdk = 'maps'
    // https를 강제해서 혼합 콘텐츠/리다이렉트 문제 방지
    const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`
    script.src = sdkUrl

    script.onload = () => {
      if (!window.kakao?.maps) {
        console.error('[KakaoMap] kakao.maps가 초기화되지 않았습니다. 도메인 허용 또는 JavaScript 키를 확인하세요.', {
          origin: window.location.origin,
        })
        return
      }
      window.kakao.maps.load(() => {
        const container = document.getElementById('kakao-map')
        if (!container) return
        const options = {
          center: new window.kakao.maps.LatLng(37.4844, 126.9297),
          level: 3,
        }
        mapRef.current = new window.kakao.maps.Map(container, options)
      })
    }

    script.onerror = () => {
      console.error('[KakaoMap] 카카오맵 스크립트 로드 실패. 다음을 확인하세요: 1) JavaScript 키, 2) 플랫폼 > Web 사이트 도메인에 현재 도메인 등록, 3) 네트워크 차단 여부', {
        url: script.src,
        origin: window.location.origin,
      })
    }
    document.head.appendChild(script)

    // 스크립트는 유지 — 페이지 전환 간 재활용
  }, [])

  // 2) 지도 준비가 되면 restaurants에 따라 마커/오버레이만 갱신
  useEffect(() => {
    if (!window.kakao?.maps || !mapRef.current) return

    // 기존 마커/오버레이 제거
    markersRef.current.forEach(m => m.setMap(null))
    overlaysRef.current.forEach(o => o.setMap(null))
    markersRef.current = []
    overlaysRef.current = []

    const kakaoMap = mapRef.current

    const getCategoriesHTML = (categories) => {
      if (!categories || !Array.isArray(categories)) {
        return '<span style="color: #999; font-size: 12px;">카테고리 없음</span>'
      }
      if (categories.length === 0) {
        return '<span style="color: #999; font-size: 12px;">카테고리 미분류</span>'
      }
      return categories.map(category =>
        `<span style="color: #E7673C; font-size: 18px; font-weight: 600; display: inline-block; margin-left:10px; ">#${category}</span>`
      ).join('')
    }

    let currentOverlay = null

    restaurants.forEach((restaurant) => {
      if (!(restaurant.lat && restaurant.lng)) return
      const markerPosition = new window.kakao.maps.LatLng(restaurant.lat, restaurant.lng)

      const imageSrc = '/src/assets/marker.svg'
      const imageSize = new window.kakao.maps.Size(64, 69)
      const imageOption = { offset: new window.kakao.maps.Point(27, 69) }
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption)

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: restaurant.name,
        image: markerImage,
      })
      marker.setMap(kakaoMap)
      markersRef.current.push(marker)

      const overlayContent = document.createElement('div')
      overlayContent.innerHTML = `
              <div style="position: relative;">
                <div style="width: 500px;
                           height: 250px;
                           border-radius: 20px;
                           background: #FFF;
                           padding: 30px;
                           box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                           position: relative;
                           z-index: 1;">
                  <div style="display: flex; align-items: center;">
                    <div style="width: 141px;
                               height: 141px;
                               margin-right: 28px;
                               border-radius: 22px;
                               background: lightgray;
                               overflow: hidden;">
                        ${restaurant.image ? 
                          `<img src="${restaurant.image}" style="width: 100%; height: 100%; object-fit: cover;" alt="${restaurant.name}">` :
                          '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px;">이미지 없음</div>'
                        }
                    </div>
                    <div>
                      <p style="color: #000;
                               font-size: 24px;
                               font-weight: 600;
                               margin: 0 0 15px 0;">${restaurant.name}</p>
                      <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184 37" style="width: 190px; height: 64px;">
                          <defs>
                            <clipPath id="stars-clip-${restaurant.id}">
                              <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z"/>
                              <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z"/>
                              <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z"/>
                              <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z"/>
                              <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z"/>
                            </clipPath>
                          </defs>
                          <g fill="#E5E7EB">
                            <path d="M17.5489 2.92705C17.8483 2.00574 19.1517 2.00574 19.4511 2.92705L22.429 12.0922C22.5629 12.5042 22.9468 12.7832 23.3801 12.7832H33.0169C33.9856 12.7832 34.3884 14.0228 33.6046 14.5922L25.8083 20.2566C25.4578 20.5112 25.3112 20.9626 25.445 21.3746L28.423 30.5398C28.7223 31.4611 27.6678 32.2272 26.8841 31.6578L19.0878 25.9934C18.7373 25.7388 18.2627 25.7388 17.9122 25.9934L10.1159 31.6578C9.33216 32.2272 8.27768 31.4611 8.57703 30.5398L11.555 21.3746C11.6888 20.9626 11.5422 20.5112 11.1917 20.2566L3.39535 14.5922C2.61164 14.0228 3.01442 12.7832 3.98314 12.7832H13.6199C14.0532 12.7832 14.4371 12.5042 14.571 12.0922L17.5489 2.92705Z"/>
                            <path d="M54.5489 2.92705C54.8483 2.00574 56.1517 2.00574 56.4511 2.92705L59.429 12.0922C59.5629 12.5042 59.9468 12.7832 60.3801 12.7832H70.0169C70.9856 12.7832 71.3884 14.0228 70.6046 14.5922L62.8083 20.2566C62.4578 20.5112 62.3112 20.9626 62.445 21.3746L65.423 30.5398C65.7223 31.4611 64.6678 32.2272 63.8841 31.6578L56.0878 25.9934C55.7373 25.7388 55.2627 25.7388 54.9122 25.9934L47.1159 31.6578C46.3322 32.2272 45.2777 31.4611 45.577 30.5398L48.555 21.3746C48.6888 20.9626 48.5422 20.5112 48.1917 20.2566L40.3954 14.5922C39.6116 14.0228 40.0144 12.7832 40.9831 12.7832H50.6199C51.0532 12.7832 51.4371 12.5042 51.571 12.0922L54.5489 2.92705Z"/>
                            <path d="M91.5489 2.92705C91.8483 2.00574 93.1517 2.00574 93.4511 2.92705L96.429 12.0922C96.5629 12.5042 96.9468 12.7832 97.3801 12.7832H107.017C107.986 12.7832 108.388 14.0228 107.605 14.5922L99.8083 20.2566C99.4578 20.5112 99.3112 20.9626 99.445 21.3746L102.423 30.5398C102.722 31.4611 101.668 32.2272 100.884 31.6578L93.0878 25.9934C92.7373 25.7388 92.2627 25.7388 91.9122 25.9934L84.1159 31.6578C83.3322 32.2272 82.2777 31.4611 82.577 30.5398L85.555 21.3746C85.6888 20.9626 85.5422 20.5112 85.1917 20.2566L77.3954 14.5922C76.6116 14.0228 77.0144 12.7832 77.9831 12.7832H87.6199C88.0532 12.7832 88.4371 12.5042 88.571 12.0922L91.5489 2.92705Z"/>
                            <path d="M128.549 2.92705C128.848 2.00574 130.152 2.00574 130.451 2.92705L133.429 12.0922C133.563 12.5042 133.947 12.7832 134.38 12.7832H144.017C144.986 12.7832 145.388 14.0228 144.605 14.5922L136.808 20.2566C136.458 20.5112 136.311 20.9626 136.445 21.3746L139.423 30.5398C139.722 31.4611 138.668 32.2272 137.884 31.6578L130.088 25.9934C129.737 25.7388 129.263 25.7388 128.912 25.9934L121.116 31.6578C120.332 32.2272 119.278 31.4611 119.577 30.5398L122.555 21.3746C122.689 20.9626 122.542 20.5112 122.192 20.2566L114.395 14.5922C113.612 14.0228 114.014 12.7832 114.983 12.7832H124.62C125.053 12.7832 125.437 12.5042 125.571 12.0922L128.549 2.92705Z"/>
                            <path d="M164.549 2.92705C164.848 2.00574 166.152 2.00574 166.451 2.92705L169.429 12.0922C169.563 12.5042 169.947 12.7832 170.38 12.7832H180.017C180.986 12.7832 181.388 14.0228 180.605 14.5922L172.808 20.2566C172.458 20.5112 172.311 20.9626 172.445 21.3746L175.423 30.5398C175.722 31.4611 174.668 32.2272 173.884 31.6578L166.088 25.9934C165.737 25.7388 165.263 25.7388 164.912 25.9934L157.116 31.6578C156.332 32.2272 155.278 31.4611 155.577 30.5398L158.555 21.3746C158.689 20.9626 158.542 20.5112 158.192 20.2566L150.395 14.5922C149.612 14.0228 150.014 12.7832 150.983 12.7832H160.62C161.053 12.7832 161.437 12.5042 161.571 12.0922L164.549 2.92705Z"/>
                          </g>
                          <g clip-path="url(#stars-clip-${restaurant.id})">
                            <rect x="0" y="0" width="${(restaurant.rating / 5) * 100}%" height="100%" fill="#FF6C6F"/>
                          </g>
                        </svg>
                        <span style="margin-left: 8px; font-size: 18px; font-weight: 400;">${restaurant.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 28px;">
                    ${getCategoriesHTML(restaurant.categories)}
                  </div>
                  <button onclick="this.parentElement.parentElement.style.display='none'" 
                          style="position: absolute; top: 15px; right: 15px; 
                                 background: none; border: none; font-size: 24px; 
                                 cursor: pointer; color: #999;">×</button>
                </div>
                <div style="position: absolute; bottom: -10px; left: 50%; 
                           transform: translateX(-50%); width: 0; height: 0; 
                           border-left: 15px solid transparent; 
                           border-right: 15px solid transparent; 
                           border-top: 15px solid #FFF; 
                           filter: drop-shadow(0 3px 6px rgba(0,0,0,0.1));"></div>
              </div>
            `

      const customOverlay = new window.kakao.maps.CustomOverlay({
        content: overlayContent,
        position: markerPosition,
        yAnchor: 1.4,
      })
      overlaysRef.current.push(customOverlay)

      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (currentOverlay) currentOverlay.setMap(null)
        customOverlay.setMap(kakaoMap)
        currentOverlay = customOverlay
      })

      const closeButton = overlayContent.querySelector('button')
      if (closeButton) {
        closeButton.onclick = () => {
          customOverlay.setMap(null)
          if (currentOverlay === customOverlay) currentOverlay = null
        }
      }
    })
  }, [restaurants])


  return (
    <div 
      id="kakao-map" 
      className="relative z-0 w-full h-[100%] rounded-tl-[40px] overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  )
}
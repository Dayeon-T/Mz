import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import MzSvg from '../assets/mz맛집.svg?react'
import UserProfile from '../components/UserProfile.jsx'
import { Card, Container } from '../components/Card.jsx'
import KakaoMap from '../components/KakaoMap.jsx'
import Signin from './Signin.jsx'

export default function Home() {
  const [showSignin, setShowSignin] = useState(false)
  const [restaurants, setRestaurants] = useState([])

  // 가게 목록 가져오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // 외래키 제약조건을 이용한 조인 쿼리
        const { data: restaurantsWithCategories, error } = await supabase
  .from('restaurants')
  .select(`
          id, name, address, lat, lng,
          restaurant_categories:restaurant_categories(
            categories:categories!restaurant_categories_category_id_fkey(name)
          )
        `);


if (error) throw error; // ← 에러 처리는 이걸로
console.log('Home: 조인된 레스토랑 데이터:', restaurantsWithCategories);
        
        if (!restaurantsWithCategories || restaurantsWithCategories.length === 0) {
          console.log('Home: 레스토랑 데이터가 없음')
          setRestaurants([])
          return
        }

        // 리뷰 데이터 가져오기
        const restaurantIds = restaurantsWithCategories.map(r => r.id)
        const { data: allReviews } = await supabase
          .from('reviews')
          .select('restaurant_id, rating')
          .in('restaurant_id', restaurantIds)
        
        console.log('Home: 리뷰 데이터:', allReviews)

        // 이미지 데이터 별도로 조회 (컬럼명 확인을 위해 여러 시도)
        console.log('Home: 이미지 테이블 구조 확인 중...')
        let allImages = []
        
        try {
          // 먼저 테이블 전체 구조 확인
          const { data: imageTest, error: imageError } = await supabase
            .from('restaurant_images')
            .select('*')
            .limit(1)
          
          console.log('Home: restaurant_images 테이블 샘플 데이터:', imageTest)
          console.log('Home: restaurant_images 에러:', imageError)
          
          if (imageTest && imageTest.length > 0) {
            console.log('Home: 이미지 테이블 컬럼들:', Object.keys(imageTest[0]))
            
            // 실제 이미지 데이터 조회 (컬럼명을 동적으로 찾기)
            const columns = Object.keys(imageTest[0])
            const urlColumn = columns.find(col => 
              col.includes('url') || col.includes('path') || col.includes('src')
            ) || 'url' // 기본값
            
            const { data: images } = await supabase
              .from('restaurant_images')
              .select(`restaurant_id, ${urlColumn}`)
              .in('restaurant_id', restaurantIds)
            
            allImages = images || []
            console.log('Home: 조회된 이미지 데이터:', allImages)
          }
        } catch (imgError) {
          console.log('Home: 이미지 조회 실패:', imgError)
        }
        
        // 모든 데이터 조합하기
        const restaurantsWithData = restaurantsWithCategories.map(restaurant => {
          // 해당 레스토랑의 리뷰들 찾기
          const restaurantReviews = allReviews?.filter(review => review.restaurant_id === restaurant.id) || []
          
          // 평균 rating 계산
          const ratings = restaurantReviews.map(review => review.rating)
          const avgRating = ratings.length > 0 
            ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
            : 4.0
          
          // 카테고리 이름들 추출 (조인된 데이터에서)
          const categories = restaurant.restaurant_categories
            ?.map(rc => rc.categories?.name)
            .filter(name => name) || []
          
          // 첫 번째 이미지 URL 추출 (별도 조회한 데이터에서)
          const restaurantImages = allImages?.filter(img => img.restaurant_id === restaurant.id) || []
          const firstImage = restaurantImages[0] ? 
            (restaurantImages[0].url || restaurantImages[0].image_url || restaurantImages[0].src || restaurantImages[0].image_path || null) : null
          
          console.log(`Home: ${restaurant.name} 카테고리:`, categories)
          console.log(`Home: ${restaurant.name} 첫번째 이미지:`, firstImage)
          
          return {
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            lat: restaurant.lat,
            lng: restaurant.lng,
            rating: parseFloat(avgRating),
            categories: categories,
            image: firstImage
          }
        })
        
        console.log('Home: 최종 처리된 데이터:', restaurantsWithData)
        setRestaurants(restaurantsWithData)
      } catch (error) {
        console.error('가게 목록 로드 오류:', error)
        // 에러 발생 시 기본 데이터라도 로드해보기
        const { data: basicData } = await supabase
          .from('restaurants')
          .select('id, name, address, lat, lng')
        console.log('Home: 기본 데이터로 fallback:', basicData)
        setRestaurants(basicData?.map(r => ({ ...r, rating: 4.0, categories: [] })) || [])
      }
    }

    fetchRestaurants()
  }, [])

  const handleLoginClick = () => {
    setShowSignin(true)
  }

  const handleBackToHome = () => {
    setShowSignin(false)
  }

  if (showSignin) {
    return <Signin onBackToHome={handleBackToHome} />
  }

  return (
    <div>
      <Container>
        <MzSvg />
        <div className='flex'>
          <div>
            <UserProfile onLoginClick={handleLoginClick} />
            <Card className="mt-[40px] w-[418px]" />
          </div>
          <div className='bg-white/80 mt-4 ml-8 box-border w-full h-screen rounded-tl-[40px] overflow-hidden'>
            <KakaoMap restaurants={restaurants} />
          </div>
        </div>
      </Container>
    </div>
  );
}
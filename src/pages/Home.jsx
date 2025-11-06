import { useState, useEffect, useMemo } from 'react'
import MzSvg from '../assets/mz맛집.svg?react'
import UserProfile from '../components/UserProfile.jsx'
import { Card, Container } from '../components/Card.jsx'
import KakaoMap from '../components/KakaoMap.jsx'
import Signin from './Signin.jsx'
import { fetchRestaurantsWithData } from '../api/restaurants'
import SearchBar from '../components/SearchBar.jsx'
import { useNavigate, Link } from 'react-router-dom'
import { signOut as signOutApi } from '../api/auth'
import Addmz from '../assets/addMz.svg?react'
import ModalBlur from '../components/ModalBlur.jsx'
import AddmzModal from '../modals/AddmzModal.jsx'

export default function Home() {
  const navigate = useNavigate()
  const [showSignin, setShowSignin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [query, setQuery] = useState("")

  // 가게 목록 가져오기
  useEffect(() => {
    const load = async () => {
      const data = await fetchRestaurantsWithData()
      setRestaurants(data)
    }
    load()
  }, [])

  const handleLoginClick = () => {
    setShowSignin(true)
  }

  const handleBackToHome = () => {
    setShowSignin(false)
  }

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return restaurants
    return restaurants.filter(r => {
      const inName = r.name?.toLowerCase().includes(q)
      const inAddr = r.address?.toLowerCase().includes(q)
      const inCat = Array.isArray(r.categories) && r.categories.some(c => c?.toLowerCase().includes(q))
      return inName || inAddr || inCat
    })
  }, [restaurants, query])

  // StoreList는 간단 목록을 원함
  const basicList = useMemo(() => filteredRestaurants.map(r => ({ id: r.id, name: r.name, address: r.address })), [filteredRestaurants])

  if (showSignin) {
    return <Signin onBackToHome={handleBackToHome} />
  }
  const handleSignOut = async () => {
    try {
      await signOutApi()
      // 즉시 로그인 화면으로 전환 (App의 인증 상태 갱신과 무관하게 빠른 피드백)
      setShowSignin(true)
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }


  return (

    // 1. 최상위 div에서 화면 높이 고정 및 레이아웃 설정
    <div className='h-screen overflow-hidden flex flex-col'>
      
      <button onClick={handleSignOut} className="text-[16px] text-gray underline mt-[8px] text-left w-fit absolute right-4 top-4 hover:text-white">
          로그아웃
      </button>
      {/* 2. Container가 남은 공간을 모두 채우도록 설정 */}
      <Container className="flex-grow flex flex-col">
        
        {/* 헤더 부분 (높이 고정) */}
        <div className='flex-shrink-0 flex'>
          <div className='w-[418px] pr-[197px]'>
            <Link to="/" aria-label="홈으로 이동">
              <MzSvg className="cursor-pointer" />
            </Link>
          </div>
          <SearchBar value={query} onChange={setQuery} onSubmit={(q)=>{
            if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
          }} />
        </div>

        {/* 3. 메인 콘텐츠 영역이 남은 공간을 모두 채우도록 설정 */}
        <div className='flex-grow flex mt-4 min-h-0'>
          {/* 왼쪽 사이드바 (높이 고정, 내부 스크롤) */}
          <div className="flex-shrink-0 w-[418px] flex flex-col">
            <UserProfile onLoginClick={handleLoginClick} />
            {/* Card가 남은 공간을 채우고 내부 스크롤 */}
            <div className="flex-grow mt-[40px] min-h-0">
              <Card className="h-full" restaurants={basicList} />
            </div>
          </div>

          {/* 4. 지도 영역이 남은 공간을 모두 채우도록 설정 (h-screen 제거) */}
          <div className='relative ml-8 w-full rounded-tl-[40px] overflow-hidden'>
            <KakaoMap restaurants={filteredRestaurants} />
            
            <div
              className='absolute bottom-12 right-12 p-4 w-16 h-16 rounded-full flex items-center justify-center text-white bg-sub z-40 shadow-lg cursor-pointer hover:bg-red-500 transition-colors'
              onClick={() => setShowAddModal(true)}
              aria-label='맛집 등록 모달 열기'
              role='button'
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAddModal(true) }}
            >
              <Addmz/>
            </div>
          </div>
        </div>
        
      </Container>
      {showAddModal && (
        <AddmzModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
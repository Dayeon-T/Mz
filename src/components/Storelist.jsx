import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Minmark from "../assets/minmark.svg?react"

export default function StoreList() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchRestaurants = async () => {
      try {
        console.log('StoreList: 가게 목록 로드 시작...')
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, address')
          .order('created_at', { ascending: false })

        console.log('StoreList: supabase 쿼리 결과:', { data, error })
        
        if (error) throw error
        
        if (mounted) {
          setRestaurants(data || [])
          console.log('StoreList: 가게 목록 설정 완료:', data?.length || 0, '개')
        }
      } catch (err) {
        console.error('가게 목록 로드 오류:', err)
        if (mounted) {
          setError(err.message)
        }
      } finally {
        if (mounted) {
          console.log('StoreList: 로딩 완료')
          setLoading(false)
        }
      }
    }

    fetchRestaurants()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-gray-500">가게 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-red-500">가게 목록을 불러올 수 없습니다: {error}</p>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center gap-[12px] pt-[100px] pl-[24px]">
        <p className="text-gray-500">등록된 가게가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="pt-[80px] pl-[24px]">
      {restaurants.map((restaurant) => (
        <div key={restaurant.id} className="flex items-center gap-[12px] mb-[50px]">
          <Minmark />
          <div>
            <p className="text-black text-2xl font-semibold">{restaurant.name}</p>
            <p className="text-text text-base font-medium">{restaurant.address}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
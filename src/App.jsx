import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Log from "./pages/Log"
import Home from "./pages/Home"
import Signin from "./pages/Signin"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('App: 인증 상태 변화:', event, session?.user?.id)
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <p>로딩중...</p>
      </div>
    )
  }

  // 로그인된 사용자는 홈으로, 아니면 로그인 페이지로
  return user ? <Home /> : <Log />
}

export default App

import { useState } from "react"
import { signIn, resetPassword } from "../api/auth"
import toast from "react-hot-toast"

const inputClass = "h-[60px] bg-[#ECECEC] rounded-[18px] p-[24px] text-[20px] box-border w-full mb-[20px] focus:outline-none focus:ring-2 focus:ring-main/70"
const labelClass = "text-[27px] font-semibold ml-[10px] mb-[15px]"

export default function Login({ onSwitchToSignUp, onLoginSuccess }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.")
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("올바른 이메일 형식을 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const { user } = await signIn({ email: email.trim(), password })
      
      console.log("User:", user)
      
      // 로그인 성공 시 홈으로 돌아가기
      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess()
        }, 1000) // 토스트 메시지를 잠시 보여준 후 이동
      }
      
    } catch (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("이메일 또는 비밀번호가 잘못되었습니다.")
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("이메일 인증이 필요합니다. 이메일을 확인해주세요.")
      } else {
        toast.error(error.message || "로그인에 실패했습니다.")
      }
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("비밀번호 재설정을 위해 이메일을 먼저 입력해주세요.")
      return
    }

    try {
      await resetPassword(email.trim())
      toast.success("비밀번호 재설정 이메일을 발송했습니다.")
    } catch (error) {
      toast.error("비밀번호 재설정 요청에 실패했습니다.")
      console.error(error)
    }
  }

  return (
    <>
      <p className='mt-[32px] text-[24px] font-semibold'>
        로그인하고&nbsp; 
        <span className='text-main font-extrabold'>
          맛집 여행&nbsp; 
        </span>을 시작하세요!
      </p>
      
      <form onSubmit={handleSubmit} className="w-full flex flex-col mt-[40px] gap-[30px]">
        <div>
          <label htmlFor="email" className={labelClass}>
            이메일
          </label>
          <input 
            id="email"
            className={inputClass}
            type="email" 
            placeholder='이메일을 입력하세요.'
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <input 
            className={inputClass}
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요." 
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="ml-[4px] w-5 h-5 accent-main"

            />
            <span className="text-[#363636] font-medium text-[18px]">
              로그인 상태유지
            </span>
          </label>
          
          <button 
            type="button"
            onClick={handleForgotPassword}
            className="text-text font-medium text-[18px] hover:underline"
            disabled={isSubmitting}
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting || !email.trim() || !password}
          className={`w-full text-white text-[24px] font-bold h-[70px] rounded-[18px] ${
            isSubmitting || !email.trim() || !password
              ? 'bg-login-bg cursor-not-allowed' 
              : 'bg-main hover:bg-main/90'
          }`}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
        
        <div className="text-center mt-[20px]">
          <p className="text-[18px] text-gray-600">
            아직 계정이 없으신가요?{" "}
            <button 
              type="button"
              className="text-main font-semibold hover:underline"
              onClick={onSwitchToSignUp}
            >
              회원가입
            </button>
          </p>
        </div>
      </form>
    </>
  );
}
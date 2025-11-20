import { useState } from "react"
import { signUp } from "../api/auth"
import { isEmailAvailable, isNicknameAvailable } from "../api/profiles"
import toast from "react-hot-toast"

const inputClass = "h-[60px] bg-[#ECECEC] rounded-[18px] p-[24px] text-[20px]  box-border w-full mb-[20px] focus:outline-none focus:ring-2 focus:ring-main/70"
const lableClass = "text-[27px] font-semibold ml-[10px] mb-[15px]"

export default function SignUp({ onSwitchToLogin }) {
  const [email, setEmail] = useState("")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [isEmailChecked, setIsEmailChecked] = useState(false)
  const [isNicknameChecked, setIsNicknameChecked] = useState(false)
  const [isEmailChecking, setIsEmailChecking] = useState(false)
  const [isNicknameChecking, setIsNicknameChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이메일 중복 확인
  const handleEmailCheck = async () => {
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요.")
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("올바른 이메일 형식을 입력해주세요.")
      return
    }

    try {
      setIsEmailChecking(true)
      const ok = await isEmailAvailable(email)
      if (ok) {
        toast.success("사용 가능한 이메일입니다.")
        setIsEmailChecked(true)
      } else {
        toast.error("이미 가입된 이메일입니다.")
        setIsEmailChecked(false)
      }
    } catch (error) {
      toast.error("이메일 확인 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setIsEmailChecking(false)
    }
  }

  // 닉네임 중복 확인
  const handleNicknameCheck = async () => {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.")
      return
    }

    try {
      setIsNicknameChecking(true)
      const ok = await isNicknameAvailable(nickname)
      if (ok) {
        toast.success("사용 가능한 닉네임입니다!")
        setIsNicknameChecked(true)
      } else {
        toast.error("이미 사용중인 닉네임입니다.")
        setIsNicknameChecked(false)
      }
    } catch (error) {
      toast.error("닉네임 확인 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setIsNicknameChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !nickname || !password) {
      toast.error("모든 필드를 입력해주세요.")
      return
    }

    if (!isEmailChecked) {
      toast.error("이메일 중복 확인을 해주세요.")
      return
    }

    if (!isNicknameChecked) {
      toast.error("닉네임 중복 확인을 해주세요.")
      return
    }

    setIsSubmitting(true)
    
    try {
      await signUp({ email, password, nickname })
      toast.success("회원가입이 완료되었습니다! 📧 이메일을 확인해주세요.")
      // 폼 초기화
      setEmail("")
      setNickname("")
      setPassword("")
      setIsEmailChecked(false)
      setIsNicknameChecked(false)
    } catch (error) {
      toast.error(error.message || "회원가입에 실패했습니다.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }


  // 이메일 변경 시 중복확인 상태 초기화
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setIsEmailChecked(false)
  }

  // 닉네임 변경 시 중복확인 상태 초기화
  const handleNicknameChange = (e) => {
    setNickname(e.target.value)
    setIsNicknameChecked(false)
  }

  return (
    <>
      <p className='mt-[32px] text-[24px] font-semibold'>
        회원가입하고&nbsp; 
        <span className='text-main font-extrabold'>
          숨은 맛집&nbsp; 
        </span>을 찾아보세요!
      </p>
      
      <form onSubmit={handleSubmit} className="w-full flex flex-col mt-[40px] gap-[17px]">
        <div>
          <label htmlFor="email" className={lableClass}>
            이메일
          </label>
          <div className="flex relative">
            <input 
              id="email"
              className="h-[60px] bg-[#ECECEC] rounded-[18px] p-[24px] text-[20px] w-full box-border mb-[20px] focus:outline-none focus:ring-2 focus:ring-main/70"
              type="email" 
              placeholder='이메일을 입력하세요.'
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <button 
              type="button"
              onClick={handleEmailCheck}
              disabled={isEmailChecking || !email.trim()}
              className={`text-white w-1/6 h-[40px] ml-[10px] rounded-[12px] absolute right-[10px] top-[10px] text-[20px] ${
                isEmailChecked ? 'bg-green-500' : 'bg-sub'
              } ${isEmailChecking || !email.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isEmailChecking ? '중복확인' : isEmailChecked ? '확인완료' : '중복확인'}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="nickname" className={lableClass}>
            닉네임
          </label>
          <div className="flex relative">
            <input 
              className="focus:outline-none focus:ring-2 focus:ring-main/70 h-[60px] bg-[#ECECEC] rounded-[18px] p-[24px] text-[20px] w-full box-border mb-[20px] "
              id="nickname"
              type="text"
              placeholder="닉네임을 입력하세요." 
              value={nickname}
              onChange={handleNicknameChange}
              disabled={isSubmitting}
              autoComplete="off"
            />
            
            <button 
              type="button"
              onClick={handleNicknameCheck}
              disabled={isNicknameChecking || !nickname.trim()}
              className={`text-white w-1/6 h-[40px] ml-[10px] rounded-[12px] absolute right-[10px] top-[10px] text-[20px] ${
                isNicknameChecked ? 'bg-green-500' : 'bg-sub'
              } ${isNicknameChecking || !nickname.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isNicknameChecking ? '중복확인' : isNicknameChecked ? '확인완료' : '중복확인'}
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className={lableClass}>
            비밀번호
          </label>
          <input 
            className={inputClass}
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요." 
            value={password}
            onChange={e=>setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmitting || !isEmailChecked || !isNicknameChecked}
          className={`w-full text-white text-[24px] font-bold h-[70px] rounded-[18px] ${
            isSubmitting || !isEmailChecked || !isNicknameChecked 
              ? 'bg-login-bg cursor-not-allowed' 
              : 'bg-main'
          }`}>
          {isSubmitting ? "처리중..." : "회원가입"}
        </button>
        
        
      </form>
      <div className="text-center flex items-center pt-8">
          <a 
            href="#"
            className="text-[18px] text-gray-600"
            onClick={(e) => {
              e.preventDefault();
              if (onSwitchToLogin) onSwitchToLogin();
            }}
          >
            이미 계정이 있으신가요? <span className="text-main font-semibold hover:underline">로그인하기</span>
          </a>
        </div>
    </>
  );
}
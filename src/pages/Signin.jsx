import { useState } from 'react'
import Logo from '../assets/mzlogo.svg?react'
import Login from '../components/Login'
import SignUp from '../components/SignUp'

export default function Signin({ onBackToHome }) {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="bg-login-bg w-screen h-screen flex items-center justify-center">
      <div className="w-[780px] 
                      h-[850px] 
                      bg-white rounded-[82px] 
                      shadow-[0px_4px_13px_6px_rgba(0,0,0,0.07)]
                      flex items-center flex-col
                      p-[40px] relative">
        
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="absolute top-[40px] left-[40px] text-gray-500 hover:text-main hover:font-bold text-2xl "
          >
            ←
          </button>
        )}
        
        <Logo className="w-[187px]" />
        
        {isSignUp ? (
          <SignUp onSwitchToLogin={() => setIsSignUp(false)} />
        ) : (
          <Login 
            onSwitchToSignUp={() => setIsSignUp(true)} 
            onLoginSuccess={onBackToHome}
          />
        )}
      </div>
    </div>
  );
}
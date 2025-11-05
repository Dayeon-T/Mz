import { useState } from 'react'
import Logo from '../assets/mzlogo.svg?react'
import Login from '../components/Login';
import SignUp from '../components/SignUp';

export default function Log() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="bg-login-bg w-screen h-screen flex items-center justify-center">
      <div className="w-[780px] 
                      h-[850px] 
                      bg-white rounded-[82px] 
                      shadow-[0px_4px_13px_6px_rgba(0,0,0,0.07)]
                      flex items-center flex-col
                      p-[40px]">
        <Logo className="w-[187px] "/>
        
        {isSignUp ? (
          <SignUp onSwitchToLogin={() => setIsSignUp(false)} />
        ) : (
          <Login onSwitchToSignUp={() => setIsSignUp(true)} />
        )}

      </div>
        
    </div>
  );
}
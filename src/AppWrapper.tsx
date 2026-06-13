import { useState } from 'react'
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import App from './App'

const DONE_KEY = 'passwordnotes-pro_onboarded_v1'
type Phase = 'splash' | 'onboard' | 'app'

export default function AppWrapper() {
  const [phase, setPhase] = useState<Phase>('splash')
  const features = ["AES encrypted notes", "Hidden secret fields", "Quick copy and reveal", "Auto-lock security"]
  return (
    <>
      {phase === 'splash' && <SplashScreen onDone={()=>setPhase(localStorage.getItem(DONE_KEY)?'app':'onboard')} color1="#10b981" color2="#059669" emoji="🔐" name="PasswordNotes Pro" tagline="Encrypted notes with secret fields"/>}
      {phase === 'onboard' && <Onboarding onDone={()=>{localStorage.setItem(DONE_KEY,'1');setPhase('app')}} color1="#10b981" emoji="🔐" name="PasswordNotes Pro" features={features}/>}
      {phase === 'app' && <App/>}
    </>
  )
}
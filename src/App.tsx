import { usePushHandlers } from '@/api/hooks'
import { useGameStore } from '@/api/store'
import LoginPage from '@/components/Login/LoginPage'
import GameLayout from '@/components/Layout/GameLayout'
import './App.css'

function App() {
  const { isLoggedIn } = useGameStore()

  usePushHandlers()

  if (!isLoggedIn) {
    return <LoginPage />
  }

  return <GameLayout />
}

export default App

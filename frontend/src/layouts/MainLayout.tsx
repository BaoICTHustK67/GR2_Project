import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatBox from '@/components/chat/ChatBox'
import { useChatStore } from '@/store/chatStore'

export default function MainLayout() {
  const { connectSocket, disconnectSocket } = useChatStore()

  useEffect(() => {
    connectSocket()
    return () => disconnectSocket()
  }, [connectSocket, disconnectSocket])

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
      <ChatBox />
      <Footer />
    </div>
  )
}

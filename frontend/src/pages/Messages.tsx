import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ChatBox from '@/components/chat/ChatBox'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import { useChatStore } from '@/store/chatStore'

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const conversationIdParam = searchParams.get('conversationId')

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    fetchConversations,
  } = useChatStore()

  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchConversations()

    const interval = setInterval(() => {
      fetchConversations(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (!conversationIdParam) return
    setActiveConversation(Number(conversationIdParam))
  }, [conversationIdParam, setActiveConversation])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const name = c.otherParticipant?.name || ''
      return name.toLowerCase().includes(q)
    })
  }, [conversations, filter])

  return (
    <div className="relative">
      <div className="h-[calc(100vh-64px)] flex bg-white dark:bg-[#121212]">
        {/* Left panel */}
        <div className="w-full md:w-[360px] border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search"
              className="mt-3 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>

          <ConversationList
            conversations={filtered}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversation(id)}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          <ChatWindow />
        </div>
      </div>

      {/* Bottom-right chat widget */}
      <ChatBox />
    </div>
  )
}

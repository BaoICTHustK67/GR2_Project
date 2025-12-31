import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import MessageComposer from './MessageComposer'
import { X } from 'lucide-react'

type Props = {
  isInPopover?: boolean
  onClose?: () => void
}

export default function ChatWindow({ isInPopover, onClose }: Props) {
  const { user } = useAuthStore()
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    isLoadingMessages,
    sendMessage,
  } = useChatStore()

  // Polling for new messages removed in favor of Socket.IO
  useEffect(() => {
    if (!activeConversationId) return
    // Initial fetch handled by setActiveConversation in store
  }, [activeConversationId])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  )

  const messages = activeConversationId ? messagesByConversation[activeConversationId] || [] : []

  const bottomRef = useRef<HTMLDivElement | null>(null)
  // Ref to track if it's the first load to force scroll bottom
  const isFirstLoadRef = useRef(true)
  const lastMessageIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Reset first load ref when conversation changes
    isFirstLoadRef.current = true
    lastMessageIdRef.current = null
  }, [activeConversationId])

  useEffect(() => {
    if (!bottomRef.current) return

    const container = bottomRef.current.parentElement
    if (!container) return

    const lastMessage = messages[messages.length - 1]
    const lastMessageId = lastMessage?.id

    // If no messages, nothing to do
    if (!lastMessage) return

    // Check if the last message has actually changed
    const isNewMessage = lastMessageId !== lastMessageIdRef.current

    if (isNewMessage) {
        lastMessageIdRef.current = lastMessageId
    }

    const isMyMessage = lastMessage?.senderId === user?.id
    
    // Logic:
    // 1. If first load, scroll to bottom immediately
    // 2. If it is a NEW message (id changed):
    //    a. If it's my message, scroll to bottom
    //    b. If it's an incoming message, only scroll if we were already close to bottom
    
    if (isFirstLoadRef.current) {
        bottomRef.current.scrollIntoView()
        isFirstLoadRef.current = false
    } else if (isNewMessage) {
        if (isMyMessage) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' })
        } else {
             // For incoming messages, we only auto-scroll if we were relatively close to the bottom
             const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
             if (distanceToBottom < 500) {
                 bottomRef.current.scrollIntoView({ behavior: 'smooth' })
             }
        }
    }
    // If it's not a new message (just a re-render or polling same data), do NOT scroll.
    
  }, [messages, user?.id])

  if (!activeConversationId || !activeConversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="text-gray-700 dark:text-gray-300 font-medium">Select a conversation to start chatting</div>
        {isInPopover && (
          <div className="mt-3 text-sm text-gray-500">
            Open the full page to pick someone to message.
            <div className="mt-2">
              <Link
                to="/messages"
                className="text-primary hover:underline"
                onClick={onClose}
              >
                Go to Messages
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  const other = activeConversation.otherParticipant

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={other?.image || '/profile.svg'}
            className="w-9 h-9 rounded-full object-cover"
            alt={other?.name || 'User'}
          />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white truncate">{other?.name}</div>
            <div className="text-xs text-gray-500">Conversation #{activeConversation.id}</div>
          </div>
        </div>

        {isInPopover && onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
             <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoadingMessages && (
          <div className="text-sm text-gray-500">Loading...</div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
              >
                {m.content}
                <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-gray-500'}`}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        onSend={(content) => sendMessage(activeConversation.id, content)}
      />
    </div>
  )
}

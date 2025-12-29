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
    fetchMessages,
  } = useChatStore()

  // Polling for new messages
  useEffect(() => {
    if (!activeConversationId) return

    const interval = setInterval(() => {
      fetchMessages(activeConversationId, true)
    }, 3000)

    return () => clearInterval(interval)
  }, [activeConversationId, fetchMessages])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  )

  const messages = activeConversationId ? messagesByConversation[activeConversationId] || [] : []

  const bottomRef = useRef<HTMLDivElement | null>(null)
  // Ref to track if it's the first load to force scroll bottom
  const isFirstLoadRef = useRef(true)

  useEffect(() => {
    // Reset first load ref when conversation changes
    isFirstLoadRef.current = true
  }, [activeConversationId])

  useEffect(() => {
    if (!bottomRef.current) return

    const container = bottomRef.current.parentElement
    if (!container) return

    // Logic:
    // 1. If first load, scroll to bottom immediately
    // 2. If user is sending a message (last message is mine), scroll to bottom
    // 3. If user is already near bottom (within 100px), scroll to bottom on new message
    // 4. Otherwise (reading history), don't scroll
    
    const lastMessage = messages[messages.length - 1]
    const isMyMessage = lastMessage?.senderId === user?.id
    
    // Check if near bottom before update (approximation)
    // We can't check 'before' update easily here as this effect runs 'after'.
    // But we can check if the current scroll position is close to the bottom *minus* the new content height?
    // Actually simplicity: if it's my message or first load, scroll. 
    // If it's a new incoming message, ideally we check scroll position but polling might make that tricky.
    // Let's stick to "if my message or first load" for robust start, and maybe "always" if it's fresh?
    
    // Actually, we can check scrollTop + clientHeight vs scrollHeight.
    // Since this runs after render, scrollHeight is already updated. 
    // So we might be "far" from bottom now.
    
    if (isFirstLoadRef.current) {
        bottomRef.current.scrollIntoView()
        isFirstLoadRef.current = false
    } else if (isMyMessage) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    } else {
        // For incoming messages, we only auto-scroll if we were relatively close to the bottom
        // Since we can't easily know "previous" scroll, we can try a heuristic:
        // If the *distance* to bottom is small enough (e.g. less than 500px), just scroll.
        // This keeps it "sticky".
         const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight
         if (distanceToBottom < 500) {
             bottomRef.current.scrollIntoView({ behavior: 'smooth' })
         }
    }
  }, [messages, user?.id]) // Removed activeConversationId from dependency to handle it in separate effect logic check

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

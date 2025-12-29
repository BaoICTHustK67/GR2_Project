import type { Conversation } from '@/types/chat'

type Props = {
  conversations: Conversation[]
  activeConversationId: number | null
  onSelectConversation: (id: number) => void
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: Props) {
  if (!conversations.length) {
    return (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-400">No conversations yet.</div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((c) => {
        const other = c.otherParticipant
        const isActive = c.id === activeConversationId
        return (
          <button
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
              isActive ? 'bg-primary/10' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={other?.image || '/profile.svg'}
                className="w-10 h-10 rounded-full object-cover"
                alt={other?.name || 'User'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {other?.name || 'Conversation'}
                  </div>
                  {c.lastMessage?.timestamp && (
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(c.lastMessage.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {c.lastMessage?.content || 'No messages yet'}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

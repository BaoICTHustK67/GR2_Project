import { useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { ChevronDown, ChevronUp } from 'lucide-react'
import ChatWindow from './ChatWindow'
import ConversationList from './ConversationList'
import { Link, useLocation } from 'react-router-dom'

export default function ChatBox() {
  const { 
    activeConversationId, 
    setActiveConversation,
    conversations,
    fetchConversations 
  } = useChatStore()
  
  const [isOpen, setIsOpen] = useState(false)
  
  // If a conversation is active, we should probably be open?
  // Or maybe we treat 'isOpen' as the state of the *list*?
  // Let's say: 
  // - Closed: Just the "Messaging" bar at bottom right.
  // - Open: The list of conversations.
  // - Active Chat: A specific chat window overrides the list? Or better, pops up separately?
  // The user image shows TWO windows. One list, one chat.
  // For simplicity and "quick access", let's make this box toggle between List and Chat, 
  // or closer to LinkedIn: The "Messaging" button opens a list. Clicking a user opens a chat.
  // Let's keep it as ONE box for now but improved style.
  // If activeConversationId is set, show ChatWindow. Else show ConversationList.
  
  // Actually, to match the "Messaging" bar style:
  // It shouldn't be a round button. It should be a bar.
  
  useEffect(() => {
    // Poll for list updates if open
    let interval: any
    if (isOpen) {
      fetchConversations(true)
      interval = setInterval(() => {
        fetchConversations(true)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isOpen, fetchConversations])

  const location = useLocation()
  
  if (location.pathname.startsWith('/messages')) {
    return null
  }

  return (
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-4 pointer-events-none">
       {/* Ensure the container passes pointer events through but children catch them */}

       {/* 2. active Chat Window (popped out to the left of the list) */}
       {activeConversationId && (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-t-lg shadow-[0_0_15px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-700 w-80 h-[500px] flex flex-col pointer-events-auto">
            {/* Header handled by ChatWindow, but we wrap it to ensure we can close it from outside if needed or use its own close */}
            <ChatWindow 
                isInPopover={true} 
                onClose={() => setActiveConversation(null)} 
            />
        </div>
       )}
       
       {/* 1. The Main Messaging List/Toggle */}
       <div className={`bg-white dark:bg-[#1e1e1e] rounded-t-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 w-80 flex flex-col pointer-events-auto transition-all duration-300 ${isOpen ? 'h-[500px]' : 'h-12'}`}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
               <div className="relative">
                 <img src="/profile.svg" className="w-6 h-6 rounded-full" />
                 <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-[#1e1e1e]"></div>
               </div>
               <span>Messaging</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
               {/* Could add 'Compose' button here */}
               {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          </button>
          
          {isOpen && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1e1e1e]">
               {/* Search bar mock */}
               <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                 <input 
                   placeholder="Search messages"
                   className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary"
                 />
               </div>
               
               {/* List */}
                <div className="flex-1 overflow-y-auto">
                    <ConversationList 
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        onSelectConversation={(id) => {
                            // When selecting from this list, we want to open a SEPARATE chat window if possible, 
                            // or just switch this view to chat.
                            // The user requested "quick access". 
                            // Let's toggle the active conversation which will render the ChatWindow in a separate "popover" side-by-side?
                            // Implementing side-by-side:
                            setActiveConversation(id)
                        }}
                    />
                </div>
                
                <div className="p-2 border-t border-gray-100 dark:border-gray-800 text-center">
                    <Link to="/messages" className="text-xs font-semibold text-gray-500 hover:text-primary uppercase tracking-wide">
                        View all messages
                    </Link>
                </div>
            </div>
          )}
       </div>
    </div>
  )
}

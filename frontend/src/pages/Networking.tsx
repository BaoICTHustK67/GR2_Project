import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { connectionsApi } from '@/lib/connectionsApi'
import { chatApi } from '@/lib/chatApi'
import type { User } from '@/types'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import { 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  MessageSquare, 
  Check, 
  X,
  Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Networking() {
  const [requests, setRequests] = useState<User[]>([])
  const [connections, setConnections] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reqRes, connRes] = await Promise.all([
        connectionsApi.listRequests(),
        connectionsApi.listConnections()
      ])
      setRequests(reqRes.requests || [])
      setConnections(connRes.connections || [])
    } catch (error) {
      console.error('Error fetching networking data:', error)
      toast.error('Failed to load networking data')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (userId: number) => {
    setProcessingId(userId)
    try {
      await connectionsApi.respond(userId, 'accept')
      toast.success('Connection accepted')
      await fetchData()
    } catch (error) {
      toast.error('Failed to accept connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: number) => {
    setProcessingId(userId)
    try {
      await connectionsApi.respond(userId, 'reject')
      toast.success('Connection rejected')
      await fetchData()
    } catch (error) {
      toast.error('Failed to reject connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemove = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this connection?')) return
    
    setProcessingId(userId)
    try {
      await connectionsApi.remove(userId)
      toast.success('Connection removed')
      await fetchData()
    } catch (error) {
      toast.error('Failed to remove connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMessage = async (userId: number) => {
    try {
      const { conversation } = await chatApi.createConversation([userId])
      navigate(`/messages?conversationId=${conversation.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Network</h1>

      {/* Connection Requests */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invitations ({requests.length})
        </h2>
        
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <Link to={`/profile/${user.id}`}>
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link to={`/profile/${user.id}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                      {user.name}
                    </Link>
                    {user.headline && (
                      <p className="text-sm text-gray-500 line-clamp-1">{user.headline}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(user.id)}
                    disabled={!!processingId}
                    className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                    title="Accept"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={!!processingId}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Reject"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No pending invitations.</p>
        )}
      </div>

      {/* My Connections */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Connections ({connections.length})
        </h2>
        
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Link to={`/profile/${user.id}`} className="flex-shrink-0">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/profile/${user.id}`} className="font-medium text-gray-900 dark:text-white hover:underline truncate block">
                      {user.name}
                    </Link>
                    {user.headline && (
                      <p className="text-xs text-gray-500 truncate">{user.headline}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMessage(user.id)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(user.id)}
                    disabled={!!processingId}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remove connection"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">You don't have any connections yet.</p>
        )}
      </div>
    </div>
  )
}

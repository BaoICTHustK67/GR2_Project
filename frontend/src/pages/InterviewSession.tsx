
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewsAPI } from '@/lib/api'
import Vapi from '@vapi-ai/web'
import {
  PhoneOff,
  Phone,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Interview } from '@/types'
import { interviewer } from '@/lib/constants'

// Vapi Instance
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || '')

export default function InterviewSession() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [callStatus, setCallStatus] = useState<'inactive' | 'loading' | 'active'>('inactive')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([])
  const [subtitle, setSubtitle] = useState<string>('Greetings! Click start to begin the interview.')
  
  const questionsRef = useRef<string[]>([])

  useEffect(() => {
    fetchInterview()
    
    // Vapi Event Listeners
    vapi.on('call-start', () => setCallStatus('active'))
    vapi.on('call-end', () => setCallStatus('inactive'))
    vapi.on('speech-start', () => setIsSpeaking(true))
    vapi.on('speech-end', () => setIsSpeaking(false))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on('message', (message: any) => {
        // Handle Live Partial Transcripts (Subtitles)
        if (message.type === 'transcript') {
             setSubtitle(message.transcript)
        }

        // Handle Final Transcripts (History)
        if (message.type === 'transcript' && message.transcriptType === 'final') {
            setMessages(prev => [...prev, {
                role: message.role === 'assistant' ? 'ai' : 'user',
                content: message.transcript
            }])
        }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on('error', (e: any) => {
        console.error('Vapi Error:', e)
        setCallStatus('inactive')
        toast.error('Connection error with voice assistant')
    })

    return () => {
        vapi.stop()
    }
  }, [id])

  const fetchInterview = async () => {
    try {
      if (!id) return;
      const response = await interviewsAPI.getInterview(parseInt(id))
      if (response.data.success) {
        setInterview(response.data.interview)
        questionsRef.current = response.data.interview.questions || []
      }
    } catch (error) {
      console.error('Error fetching interview:', error)
      toast.error('Failed to load interview session')
    } finally {
      setLoading(false)
    }
  }

  const startCall = async () => {
    if (!interview) return

    setCallStatus('loading')
    try {
        const questionsList = interview.questions.map((q: string, i: number) => `${i+1}. ${q}`).join('\n')
        
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await vapi.start(interviewer, {
            variableValues: {
                questions: questionsList,
                role: interview.role,
                level: interview.level,
            }
        })
        
    } catch (error) {
        console.error('Failed to start call:', error)
        setCallStatus('inactive')
        toast.error('Could not start the interview call')
    }
  }

  const endCall = async () => {
    vapi.stop()
    setCallStatus('inactive')
    
    // Allow ending even if no messages if the user just wants to bail
    // but for feedback keying off messages, we need them.
    if (messages.length === 0) {
        navigate('/interviews') // Just go back if nothing happened
        return
    }

    const toastId = toast.loading('Generating feedback...')
    try {
        if (!id) return
        const response = await interviewsAPI.generateFeedback(parseInt(id), messages)
        if (response.data.success) {
            toast.success('Feedback generated!', { id: toastId })
            navigate(`/interview/${id}/feedback`)
        } else {
            toast.error('Failed to generate feedback', { id: toastId })
        }
    } catch (error) {
        console.error('Error generating feedback:', error)
        toast.error('Error generating feedback', { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Interview Not Found</h2>
        <button onClick={() => navigate('/interviews')} className="btn btn-primary mt-4">
            Go Back
        </button>
      </div>
    )
  }

  // Use 'type' instead of 'interview_type' as per API logic
  // @ts-ignore
  const typeLabel = interview.type || interview.interview_type || 'Interview';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      {/* Header Info (Minimal) */}
      <div className="text-center mb-8">
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
             {interview.role}
             <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {typeLabel}
             </span>
           </h1>
           <p className="text-sm text-gray-500 mt-2">
             {callStatus === 'active' ? 'Interview in Progress' : 'Ready to Start'}
           </p>
      </div>

      {/* Main Visualizer Area */}
      <div className="relative w-full aspect-square max-w-[400px] flex items-center justify-center">
            {/* Visualizer Circles */}
            <div className={`absolute inset-0 rounded-full border border-primary/20 transition-all duration-1000 ${isSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`} />
            <div className={`absolute inset-0 rounded-full border border-primary/20 transition-all duration-1000 delay-100 ${isSpeaking ? 'scale-125 opacity-50' : 'scale-100 opacity-0'}`} />
            
            <div className={`w-48 h-48 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-2xl flex items-center justify-center relative z-10 transition-transform duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
                <img 
                    src="/ai-avatar.png" 
                    onError={(e) => e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=HustConnect'}
                    alt="AI Agent" 
                    className="w-32 h-32 rounded-full object-cover"
                />
            </div>
      </div>

      {/* Live Captions */}
      <div className="w-full max-w-2xl min-h-[80px] mt-8 mb-8 flex items-center justify-center text-center px-6">
            <p className="text-xl font-medium text-gray-700 dark:text-gray-200 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                "{subtitle}"
            </p>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs">
             {callStatus === 'active' ? (
                 <button
                    onClick={endCall}
                    className="btn bg-red-500 hover:bg-red-600 text-white w-full flex items-center justify-center gap-2 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                 >
                    <PhoneOff className="w-5 h-5" />
                    End Session
                 </button>
             ) : (
                 <button 
                    onClick={startCall}
                    disabled={callStatus === 'loading'}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
                 >
                    {callStatus === 'loading' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <Phone className="w-6 h-6" />
                    )}
                    {callStatus === 'loading' ? 'Connecting...' : 'Start Interview'}
                 </button>
             )}
      </div>

    </div>
  )
}

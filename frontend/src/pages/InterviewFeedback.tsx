import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { interviewsAPI } from '@/lib/api'
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Award, ArrowRight } from 'lucide-react'
import type { Feedback, Interview } from '@/types'

export default function InterviewFeedback() {
  const { id } = useParams<{ id: string }>()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    if (!id) return
    try {
        // Fetch Feedback
        const fbRes = await interviewsAPI.getFeedback(parseInt(id))
        if(fbRes.data.success && fbRes.data.feedback && fbRes.data.feedback.length > 0) {
            // Get the latest feedback
            setFeedback(fbRes.data.feedback[fbRes.data.feedback.length - 1])
        }

        // Fetch Interview details for context
        const intRes = await interviewsAPI.getInterview(parseInt(id))
        if(intRes.data.success) {
            setInterview(intRes.data.interview)
        }

    } catch (error) {
        console.error('Error fetching data:', error)
    } finally {
        setLoading(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>

  if (!feedback) return (
    <div className="flex flex-col h-[60vh] items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold">No Feedback Yet</h2>
        <p className="text-gray-600 mb-4">Complete your interview session to generate feedback.</p>
        <Link to={`/interview/${id}`} className="btn btn-primary">Go to Session</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Completed!</h1>
            <p className="text-gray-600 dark:text-gray-400">
                Here is your AI-generated performance analysis for the {interview?.role} role.
            </p>
        </div>

        {/* Total Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 md:col-span-1 text-center bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Score</h3>
                <div className="text-5xl font-bold text-primary mb-2">{feedback.totalScore}<span className="text-xl text-gray-400">/100</span></div>
                <p className="text-sm text-gray-500">Overall Performance</p>
            </div>

            {/* Assessment Summary */}
            <div className="card p-6 md:col-span-2">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Final Assessment
                 </h3>
                 <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feedback.finalAssessment}
                 </p>
            </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(feedback.categoryScores).map(([category, score]) => (
                <div key={category} className="card p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{score}%</div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{category}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 dark:bg-gray-700">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
                    </div>
                </div>
            ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-green-600 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Key Strengths
                </h3>
                <ul className="space-y-3">
                    {feedback.strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/20">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 rotate-180" /> Areas for Improvement
                </h3>
                <ul className="space-y-3">
                    {feedback.areasForImprovement.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="flex justify-center pt-8">
            <Link to="/interviews" className="btn btn-outline flex items-center gap-2">
                Back to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    </div>
  )
}

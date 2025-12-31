import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { interviewsAPI } from '@/lib/api'
import type { Interview } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  Video,
  Clock,
  CheckCircle,
  PlayCircle,
  Loader2,
  Star,
  ChevronRight,
} from 'lucide-react'

export default function Interviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      const response = await interviewsAPI.getMyInterviews()
      if (response.data.success) {
        setInterviews(response.data.interviews)
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInterviews = interviews.filter((interview) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !interview.completedAt
    if (filter === 'completed') return interview.completedAt
    return true
  })

  const getStatusBadge = (interview: Interview) => {
    if (interview.completedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mock Interviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice interviews powered by AI
          </p>
        </div>
        <Link to="/interview/new" className="btn btn-primary">
          <Video className="w-5 h-5" />
          New Interview
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${interviews.length})`}
            {status === 'pending' && ` (${interviews.filter((i) => !i.completedAt).length})`}
            {status === 'completed' && ` (${interviews.filter((i) => i.completedAt).length})`}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="card p-8 text-center">
          <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No interviews found
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? "You haven't started any interviews yet."
              : `You don't have any ${filter} interviews.`}
          </p>
          <Link to="/interview/new" className="btn btn-primary inline-flex">
            Start Your First Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              1. Start Interview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a job role or create a custom interview
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <PlayCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              2. Answer Questions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our AI will ask you interview questions via video
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              3. Get Feedback
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive detailed feedback and improvement tips
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InterviewCard({
  interview,
  getStatusBadge,
}: {
  interview: Interview
  getStatusBadge: (interview: Interview) => JSX.Element
}) {
  const averageScore =
    interview.feedback && interview.feedback.length > 0
      ? interview.feedback.reduce((sum, f) => sum + (f.score || 0), 0) /
        interview.feedback.length
      : null

  return (
    <Link
      to={`/interview/${interview.id}`}
      className="card p-6 block hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {interview.role}
            </h3>
            {getStatusBadge(interview)}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} •{' '}
            {(interview.level || 'entry').charAt(0).toUpperCase() + (interview.level || 'entry').slice(1)} Level
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Created {interview.createdAt ? formatDate(interview.createdAt) : '-'}
            </span>
            {interview.completedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Completed {formatDate(interview.completedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {averageScore !== null && (
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  averageScore >= 80
                    ? 'text-green-500'
                    : averageScore >= 60
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {Math.round(averageScore)}%
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Tech Stack */}
      {interview.techstack && interview.techstack.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {interview.techstack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {tech}
            </span>
          ))}
          {interview.techstack.length > 5 && (
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
              +{interview.techstack.length - 5} more
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

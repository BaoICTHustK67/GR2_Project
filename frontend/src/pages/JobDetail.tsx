import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { jobsAPI, interviewsAPI } from '@/lib/api'
import type { Job } from '@/types'
import { formatDate, formatSalary } from '@/lib/utils'
import {
  MapPin,
  Briefcase,
  Clock,
  Users,
  Building2,
  DollarSign,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Video,
  AlertCircle,
  Eye,
  XCircle,
} from 'lucide-react'

const applySchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  cvLink: z.string().url('Please enter a valid URL'),
  coverLetter: z.string().optional(),
})

type ApplyForm = z.infer<typeof applySchema>

interface UserApplication {
  id: number
  status: string
  appliedAt: string | null
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [userApplication, setUserApplication] = useState<UserApplication | null>(null)
  const [isCreatingInterview, setIsCreatingInterview] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
  })

  useEffect(() => {
    if (id) {
      fetchJob()
    }
  }, [id])

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getJob(Number(id))
      if (response.data.success) {
        setJob(response.data.job)
        // Check if user has already applied
        if (response.data.userApplication) {
          setHasApplied(true)
          setUserApplication(response.data.userApplication)
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      toast.error('Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (data: ApplyForm) => {
    if (!id) return

    setIsApplying(true)
    try {
      const response = await jobsAPI.applyToJob(Number(id), data)
      if (response.data.success) {
        toast.success('Application submitted successfully!')
        setShowApplyModal(false)
        setHasApplied(true)
        // Set the application info from response
        if (response.data.application) {
          setUserApplication({
            id: response.data.application.id,
            status: response.data.application.status || 'pending',
            appliedAt: response.data.application.createdAt || new Date().toISOString()
          })
        }
        reset()
      } else {
        toast.error(response.data.message || 'Failed to submit application')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setIsApplying(false)
    }
  }

  const handlePracticeInterview = async () => {
    if (!id) return

    setIsCreatingInterview(true)
    try {
      const response = await interviewsAPI.createInterviewFromJob(Number(id))
      if (response.data.success) {
        toast.success('Interview created! Check your interviews page.')
      }
    } catch (error) {
      toast.error('Failed to create practice interview')
    } finally {
      setIsCreatingInterview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Job not found
        </h3>
        <Link to="/jobs" className="text-primary hover:underline">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Job Header */}
      <div className="card p-6">
        <div className="flex gap-4">
          {/* Company Logo */}
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {job.title}
            </h1>
            <Link
              to={`/companies/${job.company?.id}`}
              className="text-lg text-primary hover:underline"
            >
              {job.company?.name}
            </Link>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              {job.jobType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {job.jobType}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Posted {formatDate(job.postedDate || job.createdAt || new Date())}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {job.applicantCount} applicants
              </span>
            </div>

            {(job.salaryMin || job.salaryMax) && (
              <p className="mt-3 text-xl font-semibold text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {formatSalary(job.salaryMin, job.salaryMax)}
              </p>
            )}
          </div>
        </div>

        {/* Application Status Card */}
        {userApplication && (
          <div className={`mt-4 p-4 rounded-lg border ${
            userApplication.status === 'accepted' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : userApplication.status === 'rejected'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : userApplication.status === 'reviewed'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-center gap-3">
              {userApplication.status === 'accepted' ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : userApplication.status === 'rejected' ? (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : userApplication.status === 'reviewed' ? (
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <p className={`font-medium ${
                  userApplication.status === 'accepted' 
                    ? 'text-green-800 dark:text-green-300' 
                    : userApplication.status === 'rejected'
                    ? 'text-red-800 dark:text-red-300'
                    : userApplication.status === 'reviewed'
                    ? 'text-blue-800 dark:text-blue-300'
                    : 'text-yellow-800 dark:text-yellow-300'
                }`}>
                  Application Status: <span className="capitalize">{userApplication.status}</span>
                </p>
                {userApplication.appliedAt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Applied on {formatDate(userApplication.appliedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowApplyModal(true)}
            disabled={hasApplied}
            className={`btn flex-1 ${hasApplied ? 'btn-ghost cursor-not-allowed opacity-75' : 'btn-primary'}`}
          >
            {hasApplied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Already Applied
              </>
            ) : (
              'Apply Now'
            )}
          </button>
          <button
            onClick={handlePracticeInterview}
            disabled={isCreatingInterview}
            className="btn btn-secondary"
          >
            {isCreatingInterview ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Video className="w-5 h-5" />
                Practice Interview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Job Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Responsibilities
              </h2>
              <ul className="space-y-2">
                {job.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Requirements
              </h2>
              <ul className="space-y-2">
                {job.requirements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Benefits
              </h2>
              <ul className="space-y-2">
                {job.benefits.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About the Company
            </h2>
            <div className="flex items-center gap-3 mb-4">
              {job.company?.logo ? (
                <img
                  src={job.company.logo}
                  alt={job.company.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <Link
                  to={`/companies/${job.company?.id}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-primary"
                >
                  {job.company?.name}
                </Link>
                <p className="text-sm text-gray-500">{job.company?.industry}</p>
              </div>
            </div>
            {job.company?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {job.company.description}
              </p>
            )}
            {job.company?.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Apply to {job.title}
              </h2>

              <form onSubmit={handleSubmit(handleApply)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="input"
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input"
                    placeholder="+84 123 456 789"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CV Link *
                  </label>
                  <input
                    type="url"
                    {...register('cvLink')}
                    className="input"
                    placeholder="https://..."
                  />
                  {errors.cvLink && (
                    <p className="text-sm text-red-500 mt-1">{errors.cvLink.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cover Letter
                  </label>
                  <textarea
                    {...register('coverLetter')}
                    className="input"
                    rows={4}
                    placeholder="Why are you interested in this position?"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="btn btn-primary flex-1"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

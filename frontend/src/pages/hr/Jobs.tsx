import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { jobsAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Briefcase,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  MoreVertical,
  Building2,
  AlertTriangle,
} from 'lucide-react'

interface HRJob {
  id: number
  title: string
  description: string
  location: string
  jobType: string
  status: string
  applicantCount: number
  createdAt: string
  company?: {
    id: number
    name: string
    logo?: string
  }
}

export default function HRJobs() {
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState<HRJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all')
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (user?.companyId) {
      fetchJobs()
    } else {
      setIsLoading(false)
    }
  }, [user?.companyId])

  const fetchJobs = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await jobsAPI.getHRJobs()
      if (response.data.success) {
        setJobs(response.data.jobs)
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
      setError(err.response?.data?.message || 'Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleJobStatus = async (jobId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    
    try {
      const response = await jobsAPI.updateJob(jobId, { status: newStatus })
      if (response.data.success) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? { ...job, status: newStatus }
              : job
          )
        )
        toast.success(`Job ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update job status')
    }
    setOpenMenu(null)
  }

  const deleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }
    
    setDeletingId(jobId)
    try {
      const response = await jobsAPI.deleteJob(jobId)
      if (response.data.success) {
        setJobs((prev) => prev.filter((job) => job.id !== jobId))
        toast.success('Job deleted successfully')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job')
    } finally {
      setDeletingId(null)
    }
    setOpenMenu(null)
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Show company setup warning if no company
  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your job listings
          </p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Company Required
          </h3>
          <p className="text-amber-700 dark:text-amber-300 mb-4">
            You need to be associated with a company before you can manage jobs.
          </p>
          <Link 
            to="/hr/company" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Set Up Company
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your job listings
          </p>
        </div>
        <Link to="/hr/jobs/create" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Post New Job
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'published', 'draft', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card p-8 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : "You haven't posted any jobs yet"}
          </p>
          <Link to="/hr/jobs/create" className="btn btn-primary inline-flex">
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        {job.applicantCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {job.createdAt ? formatDate(job.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          disabled={deletingId === job.id}
                        >
                          {deletingId === job.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                          ) : (
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          )}
                        </button>

                        {openMenu === job.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <Link
                              to={`/hr/jobs/${job.id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Job
                            </Link>
                            <Link
                              to={`/jobs/${job.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                              View Job
                            </Link>
                            <button
                              onClick={() => toggleJobStatus(job.id, job.status)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                            >
                              {job.status === 'published' ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Job
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  )
}

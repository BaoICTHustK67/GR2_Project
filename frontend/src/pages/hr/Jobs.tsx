import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  MoreVertical,
} from 'lucide-react'

interface HRJob {
  id: number
  title: string
  location: string
  jobType: string
  status: 'active' | 'paused' | 'closed'
  applicantCount: number
  views: number
  createdAt: string
  expiresAt?: string
}

export default function HRJobs() {
  const [jobs, setJobs] = useState<HRJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'closed'>('all')
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    // Simulate API call
    setTimeout(() => {
      setJobs([
        {
          id: 1,
          title: 'Senior React Developer',
          location: 'Ho Chi Minh City',
          jobType: 'Full-time',
          status: 'active',
          applicantCount: 24,
          views: 156,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(),
        },
        {
          id: 2,
          title: 'Full Stack Engineer',
          location: 'Remote',
          jobType: 'Full-time',
          status: 'active',
          applicantCount: 45,
          views: 289,
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 20).toISOString(),
        },
        {
          id: 3,
          title: 'DevOps Engineer',
          location: 'Hanoi',
          jobType: 'Full-time',
          status: 'paused',
          applicantCount: 12,
          views: 98,
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        },
        {
          id: 4,
          title: 'Junior Frontend Developer',
          location: 'Ho Chi Minh City',
          jobType: 'Internship',
          status: 'closed',
          applicantCount: 67,
          views: 412,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  const toggleJobStatus = (jobId: number) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: job.status === 'active' ? 'paused' : 'active',
            }
          : job
      )
    )
    setOpenMenu(null)
    toast.success('Job status updated')
  }

  const deleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job?')) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
      toast.success('Job deleted successfully')
    }
    setOpenMenu(null)
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: HRJob['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
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
            {(['all', 'active', 'paused', 'closed'] as const).map((status) => (
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
                    Views
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
                          to={`/hr/jobs/${job.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.jobType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        {job.applicantCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Eye className="w-4 h-4" />
                        {job.views}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
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
                              to={`/hr/jobs/${job.id}/applications`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Users className="w-4 h-4" />
                              View Applications
                            </Link>
                            <button
                              onClick={() => toggleJobStatus(job.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                            >
                              {job.status === 'active' ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Pause Job
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Activate Job
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
    </div>
  )
}

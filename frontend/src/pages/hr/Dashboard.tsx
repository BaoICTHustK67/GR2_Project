import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { jobsAPI } from '@/lib/api'
import {
  Users,
  Briefcase,
  Eye,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Building2,
  AlertTriangle,
  Loader2,
  Clock,
} from 'lucide-react'

interface DashboardStats {
  totalJobsPosted: number
  openPositions: number
  totalApplicants: number
  pendingApplications: number
  averageApplicantsPerJob: number
}

interface RecentApplication {
  id: number
  applicantName: string
  applicantEmail: string
  jobId: number
  jobTitle: string
  status: string
  appliedAt: string
}

export default function HRDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalJobsPosted: 0,
    openPositions: 0,
    totalApplicants: 0,
    pendingApplications: 0,
    averageApplicantsPerJob: 0,
  })
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.companyId) {
      fetchDashboardData()
    } else {
      setIsLoading(false)
    }
  }, [user?.companyId])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Fetch metrics and recent applications in parallel
      const [metricsResponse, applicationsResponse] = await Promise.all([
        jobsAPI.getHRMetrics(),
        jobsAPI.getHRRecentApplications(5)
      ])
      
      if (metricsResponse.data.success) {
        setStats(metricsResponse.data.metrics)
      }
      
      if (applicationsResponse.data.success) {
        setRecentApplications(applicationsResponse.data.applications)
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobsPosted,
      icon: Briefcase,
      color: 'bg-blue-500',
      description: 'Jobs posted',
    },
    {
      title: 'Open Positions',
      value: stats.openPositions,
      icon: Eye,
      color: 'bg-green-500',
      description: 'Currently active',
    },
    {
      title: 'Total Applicants',
      value: stats.totalApplicants,
      icon: Users,
      color: 'bg-purple-500',
      description: 'All applications',
    },
    {
      title: 'Pending Review',
      value: stats.pendingApplications,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      description: 'Needs attention',
    },
  ]

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      {/* No Company Warning Banner */}
      {!user?.companyId && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Company Association Required
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
              You need to be associated with a company before you can post jobs. 
              Join an existing company or register a new one.
            </p>
            <Link 
              to="/hr/company" 
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Set Up Company
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'HR Manager'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your job listings
          </p>
        </div>
        {user?.companyId ? (
          <Link to="/hr/jobs/create" className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Post New Job
          </Link>
        ) : (
          <Link 
            to="/hr/company" 
            className="btn btn-primary opacity-80"
            title="Set up company first"
          >
            <Building2 className="w-5 h-5" />
            Set Up Company
          </Link>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="card p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-gray-600 dark:text-gray-400">{stat.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Recent Applications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Applications
            </h2>
            <Link
              to="/hr/applications"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p>No applications yet</p>
                <p className="text-sm mt-1">Applications will appear here when candidates apply</p>
              </div>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {app.applicantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {app.applicantName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Applied for <span className="font-medium">{app.jobTitle}</span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(app.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : app.status === 'reviewed'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : app.status === 'accepted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/hr/jobs/create"
              className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors ${!user?.companyId ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Post New Job
                </p>
                <p className="text-sm text-gray-500">Create a job listing</p>
              </div>
            </Link>
            <Link
              to="/hr/jobs"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Manage Jobs
                </p>
                <p className="text-sm text-gray-500">View and edit listings</p>
              </div>
            </Link>
            <Link
              to="/hr/company"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-500/10">
                <Building2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Company Profile
                </p>
                <p className="text-sm text-gray-500">Manage company info</p>
              </div>
            </Link>
            <Link
              to="/hr/analytics"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
            >
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  View Analytics
                </p>
                <p className="text-sm text-gray-500">See performance data</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

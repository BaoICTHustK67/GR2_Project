import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { jobsAPI } from '@/lib/api'
import {
  Users,
  Briefcase,
  Eye,
  Clock,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Building2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface AnalyticsData {
  totalJobsPosted: number
  openPositions: number
  totalApplicants: number
  pendingApplications: number
  averageApplicantsPerJob: number
  acceptanceRate: number
  viewsThisMonth: number
  applicationsThisMonth: number
}

export default function HRAnalytics() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalJobsPosted: 0,
    openPositions: 0,
    totalApplicants: 0,
    pendingApplications: 0,
    averageApplicantsPerJob: 0,
    acceptanceRate: 0,
    viewsThisMonth: 0,
    applicationsThisMonth: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (user?.companyId) {
      fetchAnalytics()
    } else {
      setIsLoading(false)
    }
  }, [user?.companyId, timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await jobsAPI.getHRMetrics()
      if (response.data.success) {
        setAnalytics({
          ...response.data.metrics,
          acceptanceRate: response.data.metrics.totalApplicants > 0 
            ? Math.round((response.data.metrics.pendingApplications / response.data.metrics.totalApplicants) * 100)
            : 0,
          viewsThisMonth: Math.floor(Math.random() * 500) + 100, // Placeholder
          applicationsThisMonth: response.data.metrics.totalApplicants,
        })
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Job Views',
      value: analytics.viewsThisMonth,
      icon: Eye,
      color: 'bg-blue-500',
      change: 12,
      changeType: 'increase' as const,
    },
    {
      title: 'Applications Received',
      value: analytics.applicationsThisMonth,
      icon: Users,
      color: 'bg-green-500',
      change: 8,
      changeType: 'increase' as const,
    },
    {
      title: 'Active Listings',
      value: analytics.openPositions,
      icon: Briefcase,
      color: 'bg-purple-500',
      change: 0,
      changeType: 'neutral' as const,
    },
    {
      title: 'Avg. Time to Hire',
      value: '14 days',
      icon: Clock,
      color: 'bg-yellow-500',
      change: 5,
      changeType: 'decrease' as const,
    },
  ]

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    if (type === 'increase') return <ArrowUp className="w-4 h-4 text-green-500" />
    if (type === 'decrease') return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    if (type === 'increase') return 'text-green-600 dark:text-green-400'
    if (type === 'decrease') return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  // Show company setup warning if no company
  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your recruitment performance</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Company Required
          </h3>
          <p className="text-amber-700 dark:text-amber-300 mb-4">
            You need to be associated with a company to view analytics.
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your recruitment performance</p>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.title} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getChangeColor(stat.changeType)}`}>
                    {getChangeIcon(stat.changeType)}
                    {stat.change > 0 && <span>{stat.change}%</span>}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications Over Time */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Applications Over Time
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Chart visualization coming soon</p>
                  <p className="text-xs mt-1">Currently showing {analytics.totalApplicants} total applications</p>
                </div>
              </div>
            </div>

            {/* Application Status Distribution */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Application Status
                </h3>
                <PieChart className="w-5 h-5 text-gray-400" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Chart visualization coming soon</p>
                  <p className="text-xs mt-1">{analytics.pendingApplications} pending reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Key Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-primary">{analytics.averageApplicantsPerJob.toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-1">Avg. Applicants per Job</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-green-500">{analytics.totalJobsPosted}</p>
                <p className="text-sm text-gray-500 mt-1">Total Jobs Posted</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-purple-500">{analytics.openPositions}</p>
                <p className="text-sm text-gray-500 mt-1">Currently Open</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

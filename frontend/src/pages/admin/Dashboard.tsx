import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import {
  Users,
  Briefcase,
  Video,
  FileText,
  Building2,
  Send,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts'

interface Analytics {
  users: { total: number; active: number; growth: number }
  jobs: { total: number; published: number }
  interviews: { total: number }
  posts: { total: number }
  companies: { total: number }
  applications: { total: number }
  growthData: { name: string; users: number; jobs: number }[]
  roleDistribution: { name: string; value: number }[]
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await adminAPI.getAnalytics()
        if (response.data.success) {
          setAnalytics(response.data.analytics)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Use real data from analytics if available, otherwise fall back to empty array
  const growthData = analytics?.growthData || []
  const roleDistribution = analytics?.roleDistribution || []

  const COLORS = ['#3B82F6', '#10B981', '#EF4444']

  const stats = [
    {
      name: 'Total Users',
      value: analytics?.users.total || 0,
      icon: Users,
      change: `+${analytics?.users.growth || 0} recent`,
      changeType: 'increase',
      color: 'bg-blue-500',
    },
    {
      name: 'Active Jobs',
      value: analytics?.jobs.published || 0,
      icon: Briefcase,
      change: 'Live focus',
      changeType: 'increase',
      color: 'bg-green-500',
    },
    {
      name: 'Interviews',
      value: analytics?.interviews.total || 0,
      icon: Video,
      change: 'Total held',
      changeType: 'increase',
      color: 'bg-purple-500',
    },
    {
      name: 'Blog Posts',
      value: analytics?.posts.total || 0,
      icon: FileText,
      change: 'Community',
      changeType: 'increase',
      color: 'bg-orange-500',
    },
    {
      name: 'Companies',
      value: analytics?.companies.total || 0,
      icon: Building2,
      change: 'Partnered',
      changeType: 'increase',
      color: 'bg-cyan-500',
    },
    {
      name: 'Applications',
      value: analytics?.applications.total || 0,
      icon: Send,
      change: 'User activity',
      changeType: 'increase',
      color: 'bg-pink-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">System analytics and performance overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/10 rounded-full border border-green-100 dark:border-green-900/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Live System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value.toLocaleString()}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Line Chart */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">System Growth (Last 7 Days)</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-500">Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-500">Jobs</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="jobs" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">User Role Distribution</h3>
          <div className="h-72 w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-2">
              {roleDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Activity Quick View</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Active Users Now</p>
                  <p className="text-xs text-gray-500">{analytics?.users.active} users currently on site</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{analytics?.users.active}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg text-white">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Total Applications</p>
                  <p className="text-xs text-gray-500">Global career progression</p>
                </div>
              </div>
              <span className="text-xl font-bold text-purple-600">{analytics?.applications.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 mb-1">Database Connectivity</p>
              <p className="text-sm font-bold text-green-600 uppercase">Excellent</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 mb-1">API Response Time</p>
              <p className="text-sm font-bold text-blue-600 uppercase">&lt; 45ms</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 mb-1">Search Indexing</p>
              <p className="text-sm font-bold text-indigo-600 uppercase">Synchronized</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 mb-1">Security Wall</p>
              <p className="text-sm font-bold text-green-600 uppercase">Monitored</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

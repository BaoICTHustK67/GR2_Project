import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { jobsAPI } from '@/lib/api'
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Building2,
  AlertTriangle,
  Mail,
  Calendar,
  Briefcase,
  MapPin,
  Phone,
  FileText,
  ExternalLink,
  X,
  GraduationCap,
  Award,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Application {
  id: number
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  applicantImage?: string
  applicantBio?: string
  applicantHeadline?: string
  applicantLocation?: string
  applicantId?: number
  cvLink?: string
  coverLetter?: string
  jobId: number
  jobTitle: string
  jobLocation?: string
  jobType?: string
  status: string
  appliedAt: string
}

interface ApplicationDetail {
  id: number
  fullName: string
  email: string
  phone?: string
  cvLink?: string
  coverLetter?: string
  status: string
  appliedAt: string
  job: {
    id: number
    title: string
    location?: string
    jobType?: string
    company?: {
      id: number
      name: string
      logo?: string
    }
  }
  applicant?: {
    id: number
    name: string
    email: string
    image?: string
    coverImage?: string
    bio?: string
    headline?: string
    location?: string
    educations: Array<{
      id: number
      school: string
      degree: string
      fieldOfStudy?: string
      startDate?: string
      endDate?: string
    }>
    experiences: Array<{
      id: number
      title: string
      company: string
      location?: string
      startDate?: string
      endDate?: string
      description?: string
    }>
    skills: Array<{
      id: number
      name: string
    }>
    projects: Array<{
      id: number
      title: string
      description?: string
      url?: string
    }>
  }
}

export default function HRApplications() {
  const { user } = useAuthStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected'>('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  
  // Application detail modal
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const applicationsPerPage = 10

  useEffect(() => {
    if (user?.companyId) {
      fetchApplications()
    } else {
      setIsLoading(false)
    }
  }, [user?.companyId])

  const fetchApplications = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await jobsAPI.getHRRecentApplications(500)
      if (response.data.success) {
        setApplications(response.data.applications)
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err)
      setError(err.response?.data?.message || 'Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: number, newStatus: string) => {
    setUpdatingId(applicationId)
    try {
      const response = await jobsAPI.updateApplicationStatus(applicationId, newStatus)
      if (response.data.success) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        )
        // Also update the detail modal if open
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null)
        }
        toast.success(`Application marked as ${newStatus}`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update application status')
    } finally {
      setUpdatingId(null)
    }
  }

  const viewApplicationDetails = async (applicationId: number) => {
    setIsLoadingDetail(true)
    setShowDetailModal(true)
    
    try {
      const response = await jobsAPI.getApplicationDetails(applicationId)
      if (response.data.success) {
        setSelectedApplication(response.data.application)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load application details')
      setShowDetailModal(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedApplication(null)
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage)
  const startIndex = (currentPage - 1) * applicationsPerPage
  const endIndex = startIndex + applicationsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: typeof Clock }> = {
      pending: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
      reviewed: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye },
      accepted: { bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    }
    const style = styles[status] || styles.pending
    const Icon = style.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${style.bg}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Show company setup warning if no company
  if (!user?.companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage job applications</p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Company Required
          </h3>
          <p className="text-amber-700 dark:text-amber-300 mb-4">
            You need to be associated with a company to view applications.
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and manage job applications</p>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or job..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'reviewed', 'accepted', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Applications List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No applications found
          </h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Applications will appear here when candidates apply to your jobs'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedApplications.map((app) => (
            <div key={app.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {app.applicantImage && app.applicantImage !== '/profile.svg' ? (
                    <img
                      src={app.applicantImage}
                      alt={app.applicantName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold text-lg">
                        {app.applicantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {app.applicantName}
                    </h3>
                    {app.applicantHeadline && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {app.applicantHeadline}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {app.applicantEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {app.jobTitle}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(app.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-16 md:ml-0">
                  {getStatusBadge(app.status)}
                  
                  <div className="flex gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => viewApplicationDetails(app.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="View Details"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    
                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                          disabled={updatingId === app.id}
                          className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                          title="Mark as Reviewed"
                        >
                          {updatingId === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          disabled={updatingId === app.id}
                          className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                          title="Accept"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          disabled={updatingId === app.id}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {app.status === 'reviewed' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          disabled={updatingId === app.id}
                          className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                          title="Accept"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          disabled={updatingId === app.id}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card p-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredApplications.length)} of {filteredApplications.length} applications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Application Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetailModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {isLoadingDetail ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedApplication ? (
              <>
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Application Details
                  </h2>
                  <button
                    onClick={closeDetailModal}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Job Info */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Applied For</h3>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedApplication.job.title}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {selectedApplication.job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {selectedApplication.job.location}
                            </span>
                          )}
                          {selectedApplication.job.jobType && (
                            <span>• {selectedApplication.job.jobType}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Application Status & Actions */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Applied:</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedApplication.appliedAt)}
                      </span>
                    </div>
                    
                    {/* Status Actions */}
                    <div className="flex gap-2 ml-auto">
                      {selectedApplication.status !== 'reviewed' && selectedApplication.status !== 'accepted' && selectedApplication.status !== 'rejected' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'reviewed')}
                          disabled={updatingId === selectedApplication.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 text-sm font-medium disabled:opacity-50"
                        >
                          Mark as Reviewed
                        </button>
                      )}
                      {selectedApplication.status !== 'accepted' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                          disabled={updatingId === selectedApplication.id}
                          className="px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 text-sm font-medium disabled:opacity-50"
                        >
                          Accept
                        </button>
                      )}
                      {selectedApplication.status !== 'rejected' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                          disabled={updatingId === selectedApplication.id}
                          className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 text-sm font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Application Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Application Info
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-500">Full Name</label>
                          <p className="font-medium">{selectedApplication.fullName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Email</label>
                          <p className="font-medium flex items-center gap-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {selectedApplication.email}
                          </p>
                        </div>
                        {selectedApplication.phone && (
                          <div>
                            <label className="text-sm text-gray-500">Phone</label>
                            <p className="font-medium flex items-center gap-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {selectedApplication.phone}
                            </p>
                          </div>
                        )}
                        {selectedApplication.cvLink && (
                          <div>
                            <label className="text-sm text-gray-500">CV/Resume</label>
                            <a
                              href={selectedApplication.cvLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View CV
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedApplication.coverLetter && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Cover Letter</h3>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedApplication.coverLetter}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Applicant Profile */}
                  {selectedApplication.applicant && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Applicant Profile
                      </h3>

                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-6">
                        {selectedApplication.applicant.image && selectedApplication.applicant.image !== '/profile.svg' ? (
                          <img
                            src={selectedApplication.applicant.image}
                            alt={selectedApplication.applicant.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold text-2xl">
                              {selectedApplication.applicant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {selectedApplication.applicant.name}
                          </h4>
                          {selectedApplication.applicant.headline && (
                            <p className="text-gray-600 dark:text-gray-400">
                              {selectedApplication.applicant.headline}
                            </p>
                          )}
                          {selectedApplication.applicant.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {selectedApplication.applicant.location}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/profile/${selectedApplication.applicant.id}`}
                          target="_blank"
                          className="ml-auto px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 text-sm font-medium flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Full Profile
                        </Link>
                      </div>

                      {/* Bio */}
                      {selectedApplication.applicant.bio && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">About</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {selectedApplication.applicant.bio}
                          </p>
                        </div>
                      )}

                      {/* Skills */}
                      {selectedApplication.applicant.skills.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedApplication.applicant.skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {selectedApplication.applicant.experiences.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            Experience
                          </h4>
                          <div className="space-y-3">
                            {selectedApplication.applicant.experiences.slice(0, 3).map((exp) => (
                              <div key={exp.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {exp.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {exp.company}
                                  {exp.location && ` • ${exp.location}`}
                                </p>
                                {(exp.startDate || exp.endDate) && (
                                  <p className="text-xs text-gray-500">
                                    {exp.startDate && formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {selectedApplication.applicant.educations.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            Education
                          </h4>
                          <div className="space-y-3">
                            {selectedApplication.applicant.educations.slice(0, 3).map((edu) => (
                              <div key={edu.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {edu.school}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {edu.degree}
                                  {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                                </p>
                                {(edu.startDate || edu.endDate) && (
                                  <p className="text-xs text-gray-500">
                                    {edu.startDate && formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {selectedApplication.applicant.projects.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <FolderOpen className="w-4 h-4" />
                            Projects
                          </h4>
                          <div className="space-y-3">
                            {selectedApplication.applicant.projects.slice(0, 3).map((project) => (
                              <div key={project.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {project.title}
                                  </p>
                                  {project.url && (
                                    <a
                                      href={project.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-sm flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View
                                    </a>
                                  )}
                                </div>
                                {project.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

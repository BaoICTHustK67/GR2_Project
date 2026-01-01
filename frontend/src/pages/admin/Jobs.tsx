import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { Job } from '@/types'
import { MapPin, MoreVertical, Search, Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from 'react-hot-toast'

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    jobId: number | null
  }>({
    isOpen: false,
    jobId: null
  })

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getJobs({ page })
      if (response.data.success) {
        setJobs(response.data.jobs)
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [page])

  const handleDeleteRequest = (jobId: number) => {
    setDeleteModal({
      isOpen: true,
      jobId
    })
  }

  const executeDelete = async () => {
    if (!deleteModal.jobId) return

    try {
      const response = await adminAPI.deleteJob(deleteModal.jobId)
      if (response.data.success) {
        setJobs(jobs.filter((j) => j.id !== deleteModal.jobId))
        toast.success('Job deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete job:', error)
      toast.error('Failed to delete job')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-500 dark:text-gray-400">View and manage all job postings</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="pl-10 pr-4 py-2 bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Job Details</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Applicants</th>
                <th className="px-6 py-4">Posted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                        {job.title}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.company?.logo && (
                          <img src={job.company.logo} className="w-6 h-6 rounded border border-gray-200 shadow-sm" alt="" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">{job.company?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        job.status === 'published'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : job.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {job.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {job.applicantCount} applicants
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(job.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteRequest(job.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={executeDelete}
        title="Delete Job"
        message="Are you sure you want to delete this job posting? This action cannot be undone and will remove all applications associated with it."
        confirmText="Delete"
        type="danger"
      />
    </div>
  )
}

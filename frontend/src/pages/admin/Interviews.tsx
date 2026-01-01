import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { Interview } from '@/types'
import { CheckCircle, Clock, Trash2, MoreVertical } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from 'react-hot-toast'

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    interviewId: number | null
  }>({
    isOpen: false,
    interviewId: null
  })

  const fetchInterviews = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getInterviews({ page })
      if (response.data.success) {
        setInterviews(response.data.interviews)
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterviews()
  }, [page])

  const handleDeleteRequest = (interviewId: number) => {
    setDeleteModal({
      isOpen: true,
      interviewId
    })
  }

  const executeDelete = async () => {
    if (!deleteModal.interviewId) return

    try {
      const response = await adminAPI.deleteInterview(deleteModal.interviewId)
      if (response.data.success) {
        setInterviews(interviews.filter((i) => i.id !== deleteModal.interviewId))
        toast.success('Interview record deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete interview:', error)
      toast.error('Failed to delete interview record')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitor all system-generated interviews</p>
      </div>

      <div className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Interview</th>
                <th className="px-6 py-4">Tech Stack</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No interviews found.
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{interview.role}</span>
                        <span className="text-xs text-gray-500">{interview.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {interview.techstack.slice(0, 3).map((tech) => (
                          <span key={tech} className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                            {tech}
                          </span>
                        ))}
                        {interview.techstack.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{interview.techstack.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {interview.finalized ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`text-xs font-medium ${interview.finalized ? 'text-green-600' : 'text-yellow-600'}`}>
                          {interview.finalized ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(interview.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteRequest(interview.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Interview"
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
        title="Delete Interview Record"
        message="Are you sure you want to delete this interview record? This will permanently remove all associated logs and feedback."
        confirmText="Delete"
        type="danger"
      />
    </div>
  )
}

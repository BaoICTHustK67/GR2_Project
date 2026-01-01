import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '@/lib/api'
import { User } from '@/types'
import { Search, UserX, UserCheck, MoreVertical, ExternalLink } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'status' | 'role'
    user: User | null
    data: any
  }>({
    isOpen: false,
    type: 'status',
    user: null,
    data: null
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getUsers({ page, search })
      if (response.data.success) {
        setUsers(response.data.users)
        setTotalPages(response.data.pages)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search])

  const handleToggleStatus = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'status',
      user: user,
      data: user.status === 'active' ? 'deactivated' : 'active'
    })
  }

  const handleRoleChangeRequest = (user: User, newRole: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'role',
      user: user,
      data: newRole
    })
  }

  const executeAction = async () => {
    if (!confirmModal.user) return

    const { type, user, data } = confirmModal
    try {
      if (type === 'status') {
        const response = await adminAPI.updateUserStatus(user.id, data)
        if (response.data.success) {
          setUsers(users.map((u) => (u.id === user.id ? { ...u, status: data } : u)))
          toast.success(`User ${data === 'active' ? 'activated' : 'deactivated'} successfully`)
        }
      } else if (type === 'role') {
        const response = await adminAPI.updateUserRole(user.id, data)
        if (response.data.success) {
          setUsers(users.map((u) => (u.id === user.id ? { ...u, userRole: data } : u)))
          toast.success(`User role updated to ${data.toUpperCase()}`)
        }
      }
    } catch (error) {
      console.error(`Failed to update user ${type}:`, error)
      toast.error(`Failed to update user ${type}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage system users and access control</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center font-medium shadow-sm">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div>
                          <Link 
                            to={`/profile/${user.id}`}
                            className="text-sm font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 group"
                          >
                            {user.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.userRole}
                        onChange={(e) => handleRoleChangeRequest(user, e.target.value)}
                        className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-red-600 outline-none appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <option value="normal">NORMAL</option>
                        <option value="hr">HR</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-5 h-5" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
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

        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-opacity"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-opacity"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeAction}
        title={confirmModal.type === 'status' ? 'Update User Status' : 'Update User Role'}
        message={
          confirmModal.type === 'status'
            ? `Are you sure you want to ${confirmModal.data === 'active' ? 'activate' : 'deactivate'} ${confirmModal.user?.name}'s account?`
            : `Are you sure you want to change ${confirmModal.user?.name}'s role to ${confirmModal.data?.toUpperCase()}?`
        }
        confirmText="Update"
        type={confirmModal.type === 'status' && confirmModal.data === 'deactivated' ? 'danger' : 'warning'}
      />
    </div>
  )
}

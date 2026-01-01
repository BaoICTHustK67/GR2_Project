import { useEffect, useState } from 'react'
import { adminAPI } from '@/lib/api'
import { BlogPost } from '@/types'
import { User, Heart, MessageCircle, MoreVertical, Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from 'react-hot-toast'

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    postId: number | null
  }>({
    isOpen: false,
    postId: null
  })

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getBlogs({ page })
      if (response.data.success) {
        setBlogs(response.data.blogs)
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [page])

  const handleDeleteRequest = (postId: number) => {
    setDeleteModal({
      isOpen: true,
      postId
    })
  }

  const executeDelete = async () => {
    if (!deleteModal.postId) return

    try {
      const response = await adminAPI.deleteBlog(deleteModal.postId)
      if (response.data.success) {
        setBlogs(blogs.filter((b) => b.id !== deleteModal.postId))
        toast.success('Blog post deleted successfully')
      }
    } catch (error) {
      console.error('Failed to delete blog post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Post Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Moderate and manage system blog posts</p>
      </div>

      <div className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Content Preview</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Posted</th>
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
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No blog posts found.
                  </td>
                </tr>
              ) : (
                blogs.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {post.author.image ? (
                          <img src={post.author.image} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{post.author.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[300px]">
                        {post.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-1 group cursor-default">
                          <Heart className="w-3.5 h-3.5 group-hover:text-red-500 transition-colors" />
                          {post.likesCount}
                        </div>
                        <div className="flex items-center gap-1 group cursor-default">
                          <MessageCircle className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
                          {post.commentsCount}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(post.createdAt || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDeleteRequest(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Post"
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
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This will permanently remove the post and all associated comments."
        confirmText="Delete"
        type="danger"
      />
    </div>
  )
}

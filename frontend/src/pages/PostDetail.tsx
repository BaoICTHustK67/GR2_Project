import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { postsAPI } from '@/lib/api'
import type { BlogPost } from '@/types'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Send,
  Loader2,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Check,
} from 'lucide-react'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const fetchPost = async () => {
    try {
      const response = await postsAPI.getPost(Number(id))
      if (response.data.success) {
        setPost(response.data.post)
      } else {
        toast.error('Post not found')
        navigate('/')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load post')
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    try {
      const response = await postsAPI.toggleLike(post.id)
      if (response.data.success) {
        setPost({
          ...post,
          likes: response.data.likes,
          likesCount: response.data.likesCount,
        })
      }
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !post) return
    setIsSubmitting(true)
    try {
      const response = await postsAPI.addComment(post.id, newComment)
      if (response.data.success) {
        setPost({
          ...post,
          comments: [...(post.comments || []), response.data.comment],
          commentsCount: (post.commentsCount || 0) + 1,
        })
        setNewComment('')
        toast.success('Comment added!')
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleDelete = async () => {
    if (!post) return
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const response = await postsAPI.deletePost(post.id)
      if (response.data.success) {
        toast.success('Post deleted')
        navigate('/')
      }
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Post not found</p>
        <Link to="/" className="btn btn-primary mt-4">
          Go back to Feed
        </Link>
      </div>
    )
  }

  const isLiked = user?.id ? post.likes.includes(user.id) : false
  const isOwner = user?.id === post.author?.id

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="card">
        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex gap-3">
            {post.author?.image ? (
              <img
                src={post.author.image}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                {getInitials(post.author?.name || '')}
              </div>
            )}
            <div>
              <Link
                to={`/profile/${post.author?.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-primary"
              >
                {post.author?.name}
              </Link>
              <p className="text-sm text-gray-500">{post.author?.headline || 'HustConnect User'}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatRelativeTime(post.timestamp || post.createdAt || new Date())}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-lg">{post.content}</p>
          
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
            >
              <LinkIcon className="w-4 h-4" />
              {post.url}
            </a>
          )}

          {post.photo && (
            <img
              src={post.photo}
              alt="Post image"
              className="mt-3 rounded-lg max-h-[500px] w-full object-cover"
            />
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
          <span>{post.likesCount} likes</span>
          <span>{post.commentsCount} comments</span>
        </div>

        {/* Actions */}
        <div className="px-4 py-2 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>Like</span>
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Comments Section */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Comment Input */}
          <div className="flex gap-2">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                {getInitials(user?.name || '')}
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="input py-2"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                className="btn btn-primary px-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  {comment.author?.image ? (
                    <img
                      src={comment.author.image}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                      {getInitials(comment.author?.name || '')}
                    </div>
                  )}
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <Link
                      to={`/profile/${comment.author?.id}`}
                      className="font-medium text-sm text-gray-900 dark:text-white hover:text-primary"
                    >
                      {comment.author?.name}
                    </Link>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(comment.timestamp || new Date())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
          )}
        </div>
      </div>
    </div>
  )
}

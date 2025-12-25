import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { postsAPI, usersAPI } from '@/lib/api'
import type { BlogPost, User } from '@/types'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Image,
  Link as LinkIcon,
  MapPin,
  Loader2,
  Trash2,
  Edit2,
} from 'lucide-react'

export default function Feed() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostLocation, setNewPostLocation] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  useEffect(() => {
    fetchPosts()
    fetchSuggestions()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await postsAPI.getPosts()
      if (response.data.success) {
        setPosts(response.data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await usersAPI.getSuggestions(5)
      if (response.data.success) {
        setSuggestions(response.data.suggestions)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return

    setIsPosting(true)
    try {
      const response = await postsAPI.createPost({
        content: newPostContent,
        location: newPostLocation,
      })

      if (response.data.success) {
        setPosts([response.data.post, ...posts])
        setNewPostContent('')
        setNewPostLocation('')
        toast.success('Post created!')
      }
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  const handleLike = async (postId: number) => {
    try {
      const response = await postsAPI.toggleLike(postId)
      if (response.data.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes: response.data.likes,
              likesCount: response.data.likesCount,
            }
          }
          return post
        }))
      }
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleDeletePost = async (postId: number) => {
    try {
      const response = await postsAPI.deletePost(postId)
      if (response.data.success) {
        setPosts(posts.filter(post => post.id !== postId))
        toast.success('Post deleted')
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* HR Banner */}
        {user?.userRole === 'hr' && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">HR tools are available</p>
                  <p className="text-sm text-gray-500">Go to your HR dashboard to manage jobs and applicants.</p>
                </div>
              </div>
              <Link to="/hr/dashboard" className="btn btn-secondary text-sm">
                Open HR Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Create Post */}
        <div className="card p-4">
          <div className="flex gap-3">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                {getInitials(user?.name || '')}
              </div>
            )}
            <div className="flex-1">
              <textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full resize-none border-0 focus:ring-0 text-gray-900 dark:text-white bg-transparent placeholder-gray-500"
                rows={3}
              />
              
              {newPostLocation && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{newPostLocation}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <LinkIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const location = prompt('Enter location:')
                      if (location) setNewPostLocation(location)
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isPosting}
                  className="btn btn-primary text-sm"
                >
                  {isPosting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onLike={handleLike}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block space-y-6">
        {/* Suggested Connections */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            People you may know
          </h3>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center gap-3">
                {suggestion.image ? (
                  <img
                    src={suggestion.image}
                    alt={suggestion.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {getInitials(suggestion.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/user/${suggestion.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary truncate block"
                  >
                    {suggestion.name}
                  </Link>
                  <p className="text-sm text-gray-500 truncate">
                    {suggestion.headline || 'HustConnect User'}
                  </p>
                </div>
                <button className="btn btn-secondary text-xs py-1 px-3">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Help Center</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
          </div>
          <p>© 2024 HustConnect</p>
        </div>
      </div>
    </div>
  )
}

// Post Card Component
function PostCard({
  post,
  currentUserId,
  onLike,
  onDelete,
}: {
  post: BlogPost
  currentUserId?: number
  onLike: (postId: number) => void
  onDelete: (postId: number) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false
  const isOwner = currentUserId === post.author?.id

  return (
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
              to={`/user/${post.author?.id}`}
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
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(post.id)
                    setShowMenu(false)
                  }}
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
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{post.content}</p>
        
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
            className="mt-3 rounded-lg max-h-96 w-full object-cover"
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
          onClick={() => onLike(post.id)}
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
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <CommentsSection postId={post.id} comments={post.comments} />
        </div>
      )}
    </div>
  )
}

// Comments Section Component
function CommentsSection({ postId, comments: initialComments }: { postId: number; comments: any[] }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await postsAPI.addComment(postId, newComment)
      if (response.data.success) {
        setComments([...comments, response.data.comment])
        setNewComment('')
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="flex gap-2">
        {user?.image ? (
          <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            {getInitials(user?.name || '')}
          </div>
        )}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="input text-sm py-2"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            className="btn btn-primary text-sm px-3"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Comments List */}
      {comments.map((comment) => (
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
              to={`/user/${comment.author?.id}`}
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
  )
}

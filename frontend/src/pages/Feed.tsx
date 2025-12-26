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
  MoreHorizontal,
  Send,
  Image,
  Link as LinkIcon,
  MapPin,
  Loader2,
  Trash2,
  Edit2,
  Repeat2,
  Copy,
  Check,
  X,
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

  const handleUpdatePost = async (postId: number, content: string) => {
    try {
      const response = await postsAPI.updatePost(postId, { content })
      if (response.data.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return { ...post, content }
          }
          return post
        }))
        toast.success('Post updated')
      }
    } catch (error) {
      toast.error('Failed to update post')
    }
  }

  const handleRepost = async (postId: number, content?: string) => {
    try {
      const response = await postsAPI.repost(postId, content)
      if (response.data.success) {
        setPosts([response.data.post, ...posts])
        toast.success('Reposted!')
      }
    } catch (error) {
      toast.error('Failed to repost')
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
              onUpdate={handleUpdatePost}
              onRepost={handleRepost}
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
                    to={`/profile/${suggestion.id}`}
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
  onUpdate,
  onRepost,
}: {
  post: BlogPost
  currentUserId?: number
  onLike: (postId: number) => void
  onDelete: (postId: number) => void
  onUpdate: (postId: number, content: string) => void
  onRepost: (postId: number, content?: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostContent, setRepostContent] = useState('')
  const [copied, setCopied] = useState(false)
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false
  const isOwner = currentUserId === post.author?.id

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== post.content) {
      onUpdate(post.id, editContent)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(post.content)
    setIsEditing(false)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleRepost = () => {
    onRepost(post.id, repostContent || undefined)
    setShowRepostModal(false)
    setRepostContent('')
  }

  return (
    <>
      <div className="card">
        {/* Repost indicator */}
        {post.originalPost && (
          <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-gray-500">
            <Repeat2 className="w-4 h-4" />
            <span>{post.author?.name} reposted</span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 flex items-start justify-between">
          <div className="flex gap-3">
            {(post.originalPost ? post.originalPost.author : post.author)?.image ? (
              <img
                src={(post.originalPost ? post.originalPost.author : post.author)?.image}
                alt={(post.originalPost ? post.originalPost.author : post.author)?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                {getInitials((post.originalPost ? post.originalPost.author : post.author)?.name || '')}
              </div>
            )}
            <div>
              <Link
                to={`/profile/${(post.originalPost ? post.originalPost.author : post.author)?.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-primary"
              >
                {(post.originalPost ? post.originalPost.author : post.author)?.name}
              </Link>
              <p className="text-sm text-gray-500">
                {(post.originalPost ? post.originalPost.author : post.author)?.headline || 'HustConnect User'}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatRelativeTime(post.timestamp || post.createdAt || new Date())}</span>
                {(post.originalPost ? post.originalPost.location : post.location) && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.originalPost ? post.originalPost.location : post.location}
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
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
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
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn btn-primary text-sm"
                  disabled={!editContent.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {post.originalPost ? post.originalPost.content : post.content}
              </p>

              {/* Original post content for repost */}
              {post.content && post.originalPost && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{post.content}"</p>
                </div>
              )}
              
              {(post.originalPost ? post.originalPost.url : post.url) && (
                <a
                  href={post.originalPost ? post.originalPost.url : post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <LinkIcon className="w-4 h-4" />
                  {post.originalPost ? post.originalPost.url : post.url}
                </a>
              )}

              {(post.originalPost ? post.originalPost.photo : post.photo) && (
                <img
                  src={post.originalPost ? post.originalPost.photo : post.photo}
                  alt="Post image"
                  className="mt-3 rounded-lg max-h-96 w-full object-cover"
                />
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700">
          <span>{post.likesCount} likes</span>
          <div className="flex gap-3">
            <span>{post.commentsCount} comments</span>
            {post.repostsCount > 0 && <span>{post.repostsCount} reposts</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-2 flex items-center gap-1 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onLike(post.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Like</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Comment</span>
          </button>
          <button
            onClick={() => setShowRepostModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Repeat2 className="w-5 h-5" />
            <span className="hidden sm:inline">Repost</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <CommentsSection postId={post.id} comments={post.comments} />
          </div>
        )}
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Repost</h3>
              <button
                onClick={() => setShowRepostModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <textarea
              value={repostContent}
              onChange={(e) => setRepostContent(e.target.value)}
              placeholder="Add your thoughts (optional)..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none mb-4"
              rows={3}
            />
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                  {getInitials(post.author?.name || '')}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{post.author?.name}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(post.timestamp || new Date())}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{post.content}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRepostModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRepost}
                className="btn btn-primary"
              >
                <Repeat2 className="w-4 h-4" />
                Repost
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Comments Section Component
function CommentsSection({ postId, comments: initialComments }: { postId: number; comments: any[] }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

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

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      const response = await postsAPI.updateComment(postId, commentId, editContent)
      if (response.data.success) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, content: editContent } : c
        ))
        setEditingCommentId(null)
        setEditContent('')
        toast.success('Comment updated')
      }
    } catch (error) {
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return

    try {
      const response = await postsAPI.deleteComment(postId, commentId)
      if (response.data.success) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success('Comment deleted')
      }
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
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
        <div key={comment.id} className="flex gap-2 group">
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
          <div className="flex-1">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-start justify-between">
                <Link
                  to={`/profile/${comment.author?.id}`}
                  className="font-medium text-sm text-gray-900 dark:text-white hover:text-primary"
                >
                  {comment.author?.name}
                </Link>
                {user?.id === comment.author?.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditComment(comment)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              {editingCommentId === comment.id ? (
                <div className="mt-1 space-y-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditComment(comment.id)
                      if (e.key === 'Escape') {
                        setEditingCommentId(null)
                        setEditContent('')
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => {
                        setEditingCommentId(null)
                        setEditContent('')
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
              )}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {formatRelativeTime(comment.timestamp || new Date())}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState()
    const token = state.token
    console.log('API Request:', config.url, 'Token exists:', !!token, 'IsAuthenticated:', state.isAuthenticated)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout and redirect if it's a 401 with token-related error
    const token = useAuthStore.getState().token
    const isAuthEndpoint = error.config?.url?.includes('/auth/signin') || 
                           error.config?.url?.includes('/auth/signup')
    const errorType = error.response?.data?.error
    
    // Only clear auth and redirect for token expiration/invalidation
    if (error.response?.status === 401 && token && !isAuthEndpoint) {
      if (errorType === 'token_expired' || errorType === 'invalid_token' || errorType === 'token_revoked') {
        useAuthStore.getState().logout()
        window.location.href = '/sign-in'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  signIn: (email: string, password: string) =>
    api.post('/auth/signin', { email, password }),
  signUp: (data: { email: string; password: string; name: string; userRole?: string }) =>
    api.post('/auth/signup', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{
    name: string
    bio: string
    location: string
    headline: string
    image: string
    coverImage: string
    darkMode: boolean
  }>) => api.put('/auth/update-profile', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
}

// Users API
export const usersAPI = {
  getUsers: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get('/users', { params }),
  getUser: (id: number) => api.get(`/users/${id}`),
  getUserById: (id: number) => api.get(`/users/${id}`),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{
    name: string
    bio: string
    location: string
    headline: string
    phone: string
    website: string
    linkedin: string
    github: string
    image: string
    coverImage: string
    darkMode: boolean
  }>) => api.put('/auth/update-profile', data),
  getUserEducation: (id: number) => api.get(`/users/${id}/education`),
  getUserExperience: (id: number) => api.get(`/users/${id}/experience`),
  getUserSkills: (id: number) => api.get(`/users/${id}/skills`),
  getUserProjects: (id: number) => api.get(`/users/${id}/projects`),
  addEducation: (data: any) => api.post('/users/education', data),
  updateEducation: (id: number, data: any) => api.put(`/users/education/${id}`, data),
  deleteEducation: (id: number) => api.delete(`/users/education/${id}`),
  addExperience: (data: any) => api.post('/users/experience', data),
  updateExperience: (id: number, data: any) => api.put(`/users/experience/${id}`, data),
  deleteExperience: (id: number) => api.delete(`/users/experience/${id}`),
  addSkill: (data: any) => api.post('/users/skills', data),
  deleteSkill: (id: number) => api.delete(`/users/skills/${id}`),
  addProject: (data: any) => api.post('/users/projects', data),
  updateProject: (id: number, data: any) => api.put(`/users/projects/${id}`, data),
  deleteProject: (id: number) => api.delete(`/users/projects/${id}`),
  getSuggestions: (limit?: number) => api.get('/users/suggestions', { params: { limit } }),
  scanProfile: (role: string, level: string) => api.post('/users/scan-profile', { role, level }),
  enhanceProfile: (section: string, content: string) => api.post('/users/enhance-profile', { section, content }),
  scanCV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/scan-cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  bulkUpdateProfile: (data: any) => api.post('/users/profile/bulk-update', data),
}

// Jobs API
export const jobsAPI = {
  getJobs: (params?: { page?: number; per_page?: number; search?: string; location?: string; jobType?: string }) =>
    api.get('/jobs', { params }),
  getJob: (id: number) => api.get(`/jobs/${id}`),
  getRecommendations: () => api.get('/jobs/recommendations'),
  createJob: (data: any) => api.post('/jobs', data),
  updateJob: (id: number, data: any) => api.put(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  applyToJob: (id: number, data: any) => api.post(`/jobs/${id}/apply`, data),
  getJobApplications: (id: number) => api.get(`/jobs/${id}/applications`),
  getApplicationDetails: (id: number) => api.get(`/jobs/applications/${id}`),
  updateApplicationStatus: (id: number, status: string) =>
    api.patch(`/jobs/applications/${id}/status`, { status }),
  getMyApplications: () => api.get('/jobs/my-applications'),
  getHRJobs: () => api.get('/jobs/hr/jobs'),
  getHRMetrics: (params?: { range?: string }) => api.get('/jobs/hr/metrics', { params }),
  getHRRecentApplications: (limit?: number) => api.get('/jobs/hr/recent-applications', { params: { limit } }),
}

// Posts API
export const postsAPI = {
  getPosts: (params?: { page?: number; per_page?: number }) =>
    api.get('/posts', { params }),
  getRandomPosts: (limit?: number) => api.get('/posts/random', { params: { limit } }),
  getPost: (id: number) => api.get(`/posts/${id}`),
  createPost: (data: { content: string; location?: string; url?: string; photo?: string }) =>
    api.post('/posts', data),
  updatePost: (id: number, data: { content?: string; url?: string }) =>
    api.put(`/posts/${id}`, data),
  deletePost: (id: number) => api.delete(`/posts/${id}`),
  toggleLike: (id: number) => api.post(`/posts/${id}/like`),
  getComments: (postId: number) => api.get(`/posts/${postId}/comments`),
  addComment: (postId: number, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),
  updateComment: (postId: number, commentId: number, content: string) =>
    api.put(`/posts/${postId}/comments/${commentId}`, { content }),
  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
  repost: (postId: number, content?: string) =>
    api.post(`/posts/${postId}/repost`, { content }),
  getUserPosts: (userId: number, params?: { page?: number; per_page?: number }) =>
    api.get(`/posts/user/${userId}`, { params }),
}

// Companies API
export const companiesAPI = {
  getCompanies: (params?: { page?: number; per_page?: number; search?: string; industry?: string }) =>
    api.get('/companies', { params }),
  getCompany: (id: number) => api.get(`/companies/${id}`),
  createCompany: (data: any) => api.post('/companies', data),
  updateCompany: (id: number, data: any) => api.put(`/companies/${id}`, data),
  toggleFollow: (id: number) => api.post(`/companies/${id}/follow`),
  followCompany: (id: number) => api.post(`/companies/${id}/follow`),
  unfollowCompany: (id: number) => api.post(`/companies/${id}/follow`),
  getCompanyJobs: (id: number) => api.get(`/companies/${id}/jobs`),
  getCompanyFollowers: (id: number) => api.get(`/companies/${id}/followers`),
  getMyCompany: () => api.get('/companies/my-company'),
  // Search & Join Request APIs
  searchCompanies: (query: string) => api.get('/companies/search', { params: { q: query } }),
  requestJoinCompany: (companyId: number, message?: string) => 
    api.post(`/companies/${companyId}/request-join`, { message }),
  getMyJoinRequest: () => api.get('/companies/my-join-request'),
  cancelJoinRequest: () => api.delete('/companies/my-join-request'),
  getJoinRequests: (status?: string) => api.get('/companies/join-requests', { params: { status } }),
  reviewJoinRequest: (requestId: number, action: 'approve' | 'reject') =>
    api.put(`/companies/join-requests/${requestId}`, { action }),
  getHRMembers: () => api.get('/companies/hr-members'),
  removeHRMember: (userId: number) => api.delete(`/companies/hr-members/${userId}`),
  searchHRUsers: (query: string) => api.get('/companies/search-hr-users', { params: { q: query } }),
  addHRMember: (userId: number) => api.post('/companies/hr-members', { userId }),
}

// Interviews API
export const interviewsAPI = {
  getInterviews: () => api.get('/interviews'),
  getMyInterviews: () => api.get('/interviews'), // Alias for build compatibility
  getLatestInterviews: (limit?: number) => api.get('/interviews/latest', { params: { limit } }),
  getInterview: (id: number) => api.get(`/interviews/${id}`),
  createInterview: (data: any) => api.post('/interviews', data),
  createInterviewFromJob: (jobId: number) => api.post('/interviews/from-job', { jobId }),
  updateInterview: (id: number, data: any) => api.put(`/interviews/${id}`, data),
  getFeedback: (interviewId: number) => api.get(`/interviews/${interviewId}/feedback`),
  createFeedback: (interviewId: number, data: any) =>
    api.post(`/interviews/${interviewId}/feedback`, data),
  generateInterview: (data: {
    role: string
    level: string
    techstack: string
    type: string
  }) => api.post('/interviews/generate', data),
  generateFeedback: (interviewId: number, transcript: any[]) => 
    api.post(`/interviews/${interviewId}/feedback`, { transcript }),
  deleteInterview: (id: number) => api.delete(`/interviews/${id}`),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (params?: { unread?: boolean; limit?: number }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}`),
}

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  updateUserStatus: (id: number, status: 'active' | 'deactivated') =>
    api.put(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: number, role: 'normal' | 'hr' | 'admin') =>
    api.put(`/admin/users/${id}/role`, { role }),
  getJobs: (params?: { page?: number; per_page?: number }) =>
    api.get('/admin/jobs', { params }),
  deleteJob: (id: number) => api.delete(`/admin/jobs/${id}`),
  getInterviews: (params?: { page?: number; per_page?: number }) =>
    api.get('/admin/interviews', { params }),
  deleteInterview: (id: number) => api.delete(`/admin/interviews/${id}`),
  getBlogs: (params?: { page?: number; per_page?: number }) =>
    api.get('/admin/blogs', { params }),
  deleteBlog: (id: number) => api.delete(`/admin/blogs/${id}`),
}

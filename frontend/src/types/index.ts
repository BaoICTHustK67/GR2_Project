// User types
export interface User {
  id: number
  email: string
  name: string
  userRole: 'normal' | 'hr' | 'admin'
  status: 'active' | 'deactivated'
  image?: string
  coverImage?: string
  bio?: string
  location?: string
  headline?: string
  darkMode?: boolean
  companyId?: number
  createdAt?: string
}

// Company types
export interface Company {
  id: number
  name: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: string
  location?: string
  founded?: number
  followersCount?: number
  createdAt?: string
}

// Job types
export interface Job {
  id: number
  title: string
  description: string
  location?: string
  jobType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  status: 'draft' | 'published' | 'closed'
  company: Company
  applicantCount: number
  createdAt?: string
  postedDate?: string
}

export interface Application {
  id: number
  jobId: number
  userId: number
  fullName: string
  email: string
  phone?: string
  cvLink?: string
  coverLetter?: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
  createdAt?: string
  job?: Job
  applicant?: User
}

// Blog types
export interface BlogPost {
  id: number
  author: User
  content: string
  location?: string
  url?: string
  photo?: string
  likes: number[]
  likesCount: number
  commentsCount: number
  comments: Comment[]
  repostsCount: number
  originalPost?: BlogPost
  timestamp?: string
  createdAt?: string
}

export interface Comment {
  id: number
  postId: number
  author: User
  content: string
  timestamp?: string
}

// Interview types
export interface Interview {
  id: number
  userId: number
  jobId?: number
  role: string
  type: string
  techstack: string[]
  questions: string[]
  coverImage?: string
  finalized: boolean
  createdAt?: string
}

export interface Feedback {
  id: number
  interviewId: number
  userId: number
  totalScore: number
  categoryScores: Record<string, number>
  strengths: string[]
  areasForImprovement: string[]
  finalAssessment?: string
  createdAt?: string
}

// Profile types
export interface Education {
  id: number
  school: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface Experience {
  id: number
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  description?: string
}

export interface Skill {
  id: number
  name: string
  level?: string
}

export interface Project {
  id: number
  name: string
  description?: string
  url?: string
  technologies: string[]
  startDate?: string
  endDate?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  items: T[]
  total: number
  pages: number
  currentPage: number
}

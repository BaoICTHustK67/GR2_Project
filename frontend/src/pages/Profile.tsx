import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { usersAPI } from '@/lib/api'
import { connectionsApi } from '@/lib/connectionsApi'
import { chatApi } from '@/lib/chatApi'
import { useAuthStore } from '@/store/authStore'
import type { User, Education, Experience, Project } from '@/types'
import { getInitials, formatMonthYear } from '@/lib/utils'
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Code,
  FolderOpen,
  Edit,
  Loader2,
  UserPlus,
  UserCheck,
  Plus,
  Trash2,
  X,
  Save,
  Camera,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
} from 'lucide-react'
import { AIEnhancementDialog } from '@/components/profile/AIEnhancementDialog'

// Form Schemas
const aboutSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  headline: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  github: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  image: z.string().optional(),
  coverImage: z.string().optional(),
})

const experienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
})

const educationSchema = z.object({
  school: z.string().min(1, 'School is required'),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
})

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.string().optional(),
})

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  technologies: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type AboutForm = z.infer<typeof aboutSchema>
type ExperienceForm = z.infer<typeof experienceSchema>
type EducationForm = z.infer<typeof educationSchema>
type SkillForm = z.infer<typeof skillSchema>
type ProjectForm = z.infer<typeof projectSchema>

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser, setUser } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  
  const navigate = useNavigate()
  
  // Edit modal states
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile Scan states
  const [showScanModal, setShowScanModal] = useState(false)
  const [isScanningProfile, setIsScanningProfile] = useState(false)
  const [scanResults, setScanResults] = useState<any>(null)
  const [targetRole, setTargetRole] = useState('')
  const [targetLevel, setTargetLevel] = useState('Mid')

  const isOwnProfile = !id || id === String(currentUser?.id)

  useEffect(() => {
    fetchProfile()
  }, [id, isOwnProfile])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      if (isOwnProfile) {
        const response = await usersAPI.getProfile()
        if (response.data.success) {
          const userData = response.data.user
          // Fetch additional profile data
          const [eduRes, expRes, skillRes, projRes] = await Promise.all([
            usersAPI.getUserEducation(userData.id).catch(() => ({ data: { education: [] } })),
            usersAPI.getUserExperience(userData.id).catch(() => ({ data: { experience: [] } })),
            usersAPI.getUserSkills(userData.id).catch(() => ({ data: { skills: [] } })),
            usersAPI.getUserProjects(userData.id).catch(() => ({ data: { projects: [] } })),
          ])
          setProfile({
            ...userData,
            education: eduRes.data.education || [],
            experience: expRes.data.experience || [],
            skills: skillRes.data.skills || [],
            projects: projRes.data.projects || [],
          })
        }
      } else {
        const response = await usersAPI.getUser(Number(id))
        if (response.data.success) {
          const userData = response.data.user
          // Fetch additional profile data
          const [eduRes, expRes, skillRes, projRes] = await Promise.all([
            usersAPI.getUserEducation(Number(id)).catch(() => ({ data: { education: [] } })),
            usersAPI.getUserExperience(Number(id)).catch(() => ({ data: { experience: [] } })),
            usersAPI.getUserSkills(Number(id)).catch(() => ({ data: { skills: [] } })),
            usersAPI.getUserProjects(Number(id)).catch(() => ({ data: { projects: [] } })),
          ])
          setProfile({
            ...userData,
            education: eduRes.data.education || [],
            experience: expRes.data.experience || [],
            skills: skillRes.data.skills || [],
            projects: projRes.data.projects || [],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (isOwnProfile && currentUser) {
        setProfile(currentUser as User)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!profile) return
    setIsConnecting(true)
    try {
      if (profile.connectionStatus === 'pending') {
         // If we are the recipient, accept? Or if we are requester...
         // Actually the button logic should separate these cases. 
         // If status is 'pending' and isRequester is true, button might be disabled or "Cancel".
         // If isRequester is false, button is "Accept".
         if (!profile.isRequester) {
            await connectionsApi.respond(profile.id, 'accept')
            setProfile(prev => prev ? { ...prev, connectionStatus: 'accepted' } : null)
            toast.success('Connection accepted!')
         }
      } else if (profile.connectionStatus === 'accepted') {
         // handle disconnect? or ignore since we show "Connected"
      } else {
         await connectionsApi.sendRequest(profile.id)
         setProfile(prev => prev ? { ...prev, connectionStatus: 'pending', isRequester: true } : null)
         toast.success('Connection request sent!')
      }
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error('Failed to update connection')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleMessage = async () => {
    if (!profile) return
    try {
      const { conversation } = await chatApi.createConversation([profile.id])
      navigate(`/messages?conversationId=${conversation.id}`)
    } catch (error) {
      console.error('Error messaging:', error)
      toast.error('Failed to start conversation')
    }
  }

  const openEditModal = (section: string, item?: any) => {
    setEditingSection(section)
    setEditingItem(item || null)
  }

  const closeEditModal = () => {
    setEditingSection(null)
    setEditingItem(null)
  }

  const handleSaveAbout = async (data: AboutForm) => {
    setIsSaving(true)
    try {
      const response = await usersAPI.updateProfile({
        name: data.name,
        headline: data.headline || undefined,
        bio: data.bio || undefined,
        location: data.location || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        linkedin: data.linkedin || undefined,
        github: data.github || undefined,
        image: data.image || undefined,
        coverImage: data.coverImage || undefined,
      })
      if (response.data.success) {
        toast.success('Profile updated successfully!')
        setProfile(prev => prev ? { ...prev, ...response.data.user } : null)
        if (response.data.user) {
          setUser(response.data.user)
        }
        closeEditModal()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveExperience = async (data: ExperienceForm) => {
    setIsSaving(true)
    try {
      if (editingItem?.id) {
        await usersAPI.updateExperience(editingItem.id, data)
        toast.success('Experience updated!')
      } else {
        await usersAPI.addExperience(data)
        toast.success('Experience added!')
      }
      await fetchProfile()
      closeEditModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save experience')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteExperience = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return
    try {
      await usersAPI.deleteExperience(id)
      toast.success('Experience deleted!')
      await fetchProfile()
    } catch (error) {
      toast.error('Failed to delete experience')
    }
  }

  const handleSaveEducation = async (data: EducationForm) => {
    setIsSaving(true)
    try {
      if (editingItem?.id) {
        await usersAPI.updateEducation(editingItem.id, data)
        toast.success('Education updated!')
      } else {
        await usersAPI.addEducation(data)
        toast.success('Education added!')
      }
      await fetchProfile()
      closeEditModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save education')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEducation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education?')) return
    try {
      await usersAPI.deleteEducation(id)
      toast.success('Education deleted!')
      await fetchProfile()
    } catch (error) {
      toast.error('Failed to delete education')
    }
  }

  const handleSaveSkill = async (data: SkillForm) => {
    setIsSaving(true)
    try {
      await usersAPI.addSkill(data)
      toast.success('Skill added!')
      await fetchProfile()
      closeEditModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save skill')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSkill = async (id: number) => {
    try {
      await usersAPI.deleteSkill(id)
      toast.success('Skill deleted!')
      await fetchProfile()
    } catch (error) {
      toast.error('Failed to delete skill')
    }
  }

  const handleSaveProject = async (data: ProjectForm) => {
    setIsSaving(true)
    try {
      const projectData = {
        ...data,
        technologies: data.technologies ? data.technologies.split(',').map(t => t.trim()) : [],
      }
      if (editingItem?.id) {
        await usersAPI.updateProject(editingItem.id, projectData)
        toast.success('Project updated!')
      } else {
        await usersAPI.addProject(projectData)
        toast.success('Project added!')
      }
      await fetchProfile()
      closeEditModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await usersAPI.deleteProject(id)
      toast.success('Project deleted!')
      await fetchProfile()
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const handleScanProfile = async () => {
    if (!targetRole) {
      toast.error('Please enter a target role')
      return
    }

    const hasData = (profile?.experience?.length || 0) > 0 || 
                    (profile?.education?.length || 0) > 0 || 
                    (profile?.skills?.length || 0) > 0 || 
                    (profile?.projects?.length || 0) > 0

    if (!hasData) {
      toast.error('Please set up at least one section: Experience, Education, Skills, or Projects.')
      return
    }

    setIsScanningProfile(true)
    try {
      const response = await usersAPI.scanProfile(targetRole, targetLevel)
      if (response.data.success) {
        setScanResults(response.data.results)
        setShowScanModal(false)
        toast.success('Profile scan completed!')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to scan profile')
    } finally {
      setIsScanningProfile(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          User not found
        </h3>
        <Link to="/" className="text-primary hover:underline">
          Go back home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-32 bg-gradient-to-r from-primary to-primary/70 relative"
          style={profile.coverImage ? { backgroundImage: `url(${profile.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('about')}
              className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-800"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-primary text-white flex items-center justify-center text-3xl font-bold">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-12 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.name}
                  </h1>
                  {profile.headline && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {profile.headline}
                    </p>
                  )}
                  {profile.connectionsCount !== undefined && (
                    <Link to="/network" className="text-primary hover:underline text-sm font-medium mt-1 block">
                      {profile.connectionsCount} connections
                    </Link>
                  )}
                  {profile.location && (
                    <p className="flex items-center gap-1 text-gray-500 mt-2">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowScanModal(true)}
                        className="btn bg-gradient-to-r from-purple-600 to-primary text-white hover:from-purple-700 hover:to-primary/90 border-none shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                        Scan Profile
                      </button>
                      <button
                        onClick={() => openEditModal('about')}
                        className="btn btn-outline"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleMessage}
                        className="btn btn-outline"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                      
                      {profile.connectionStatus === 'accepted' ? (
                        <button
                          disabled
                          className="btn btn-primary"
                        >
                          <UserCheck className="w-4 h-4" />
                          Connected
                        </button>
                      ) : profile.connectionStatus === 'pending' ? (
                        profile.isRequester ? (
                          <button
                            disabled
                            className="btn btn-outline"
                          >
                            <Clock className="w-4 h-4" />
                            Pending
                          </button>
                        ) : (
                          <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="btn btn-primary"
                          >
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                Accept
                              </>
                            )}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={handleConnect}
                          disabled={isConnecting}
                          className="btn btn-primary"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Connect
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </a>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Results */}
      {scanResults && (
        <div className="card p-6 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 border-purple-100 dark:border-purple-900/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2">
            <button 
              onClick={() => setScanResults(null)}
              className="p-1 hover:bg-black/5 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    className="text-gray-200 dark:text-gray-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - scanResults.matchingScore / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                </svg>
                <span className="absolute text-xl font-bold">{scanResults.matchingScore}%</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mt-2">Match Score</p>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Analysis for {targetRole} ({targetLevel} Level)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                  {scanResults.feedback}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Strengths
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    {scanResults.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-1.5 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    Gap Areas
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    {scanResults.gaps.map((g: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-yellow-500 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <TrendingUp className="w-4 h-4" />
                  Recommendations
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scanResults.recommendations.map((r: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white/50 dark:bg-black/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('about')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        {profile.bio ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {profile.bio}
          </p>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Add a bio to tell people about yourself.' : 'No bio added yet.'}
          </p>
        )}
      </div>

      {/* Experience Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Experience
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('experience')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        {profile.experience && profile.experience.length > 0 ? (
          <div className="space-y-6">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="flex gap-4 group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {exp.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {formatMonthYear(exp.startDate)} - {exp.isCurrent ? 'Present' : formatMonthYear(exp.endDate) || 'Present'}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal('experience', exp)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Add your work experience to showcase your career.' : 'No experience added yet.'}
          </p>
        )}
      </div>

      {/* Education Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('education')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        {profile.education && profile.education.length > 0 ? (
          <div className="space-y-6">
            {profile.education.map((edu) => (
              <div key={edu.id} className="flex gap-4 group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {edu.school}
                      </h3>
                      {(edu.degree || edu.fieldOfStudy) && (
                        <p className="text-gray-600 dark:text-gray-400">
                          {edu.degree}{edu.degree && edu.fieldOfStudy && ' in '}{edu.fieldOfStudy}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatMonthYear(edu.startDate)} - {formatMonthYear(edu.endDate) || 'Present'}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal('education', edu)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  {edu.description && (
                    <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Add your education background.' : 'No education added yet.'}
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Code className="w-5 h-5" />
            Skills
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('skill')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        {profile.skills && profile.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="group px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1"
              >
                {skill.name}
                {skill.level && <span className="text-xs opacity-70">({skill.level})</span>}
                {isOwnProfile && (
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Add skills to highlight your expertise.' : 'No skills added yet.'}
          </p>
        )}
      </div>

      {/* Projects Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Projects
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => openEditModal('project')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        {profile.projects && profile.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  {isOwnProfile && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('project', project)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Edit className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {(project.startDate || project.endDate) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatMonthYear(project.startDate)} - {formatMonthYear(project.endDate) || 'Present'}
                  </p>
                )}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-primary hover:underline"
                  >
                    View Project
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Add projects to showcase your work.' : 'No projects added yet.'}
          </p>
        )}
      </div>

      {/* Edit Modals */}
      {editingSection === 'about' && (
        <AboutModal
          profile={profile}
          onSave={handleSaveAbout}
          onClose={closeEditModal}
          isSaving={isSaving}
        />
      )}
      {editingSection === 'experience' && (
        <ExperienceModal
          experience={editingItem}
          onSave={handleSaveExperience}
          onClose={closeEditModal}
          isSaving={isSaving}
        />
      )}
      {editingSection === 'education' && (
        <EducationModal
          education={editingItem}
          onSave={handleSaveEducation}
          onClose={closeEditModal}
          isSaving={isSaving}
        />
      )}
      {editingSection === 'skill' && (
        <SkillModal
          onSave={handleSaveSkill}
          onClose={closeEditModal}
          isSaving={isSaving}
        />
      )}
      {editingSection === 'project' && (
        <ProjectModal
          project={editingItem}
          onSave={handleSaveProject}
          onClose={closeEditModal}
          isSaving={isSaving}
        />
      )}

      {showScanModal && (
        <ScanProfileModal
          onScan={handleScanProfile}
          onClose={() => setShowScanModal(false)}
          isScanning={isScanningProfile}
          targetRole={targetRole}
          setTargetRole={setTargetRole}
          targetLevel={targetLevel}
          setTargetLevel={setTargetLevel}
        />
      )}
    </div>
  )
}

// Modal Components
function AboutModal({ profile, onSave, onClose, isSaving }: { 
  profile: User
  onSave: (data: AboutForm) => void
  onClose: () => void
  isSaving: boolean 
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AboutForm>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      name: profile.name,
      headline: profile.headline || '',
      bio: profile.bio || '',
      location: profile.location || '',
      phone: profile.phone || '',
      website: profile.website || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      image: profile.image || '',
      coverImage: profile.coverImage || '',
    },
  })

  const [aiDialog, setAiDialog] = useState<{ section: 'headline' | 'about', content: string } | null>(null)
  
  const headline = watch('headline')
  const bio = watch('bio')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input {...register('name')} className="input w-full" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
              <input {...register('headline')} className="input w-full" placeholder="e.g. Software Engineer at Company" />
              <button
                type="button"
                onClick={() => setAiDialog({ section: 'headline', content: headline || '' })}
                className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Write with AI
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea {...register('bio')} className="input w-full" rows={4} placeholder="Tell us about yourself..." />
              <button
                type="button"
                onClick={() => setAiDialog({ section: 'about', content: bio || '' })}
                className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Write with AI
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input {...register('location')} className="input w-full" placeholder="City, Country" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input {...register('phone')} className="input w-full" placeholder="+1 234 567 890" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
              <input {...register('website')} className="input w-full" placeholder="https://yourwebsite.com" />
              {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn</label>
              <input {...register('linkedin')} className="input w-full" placeholder="https://linkedin.com/in/..." />
              {errors.linkedin && <p className="text-sm text-red-500 mt-1">{errors.linkedin.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub</label>
              <input {...register('github')} className="input w-full" placeholder="https://github.com/..." />
              {errors.github && <p className="text-sm text-red-500 mt-1">{errors.github.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image URL</label>
              <input {...register('image')} className="input w-full" placeholder="https://..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
              <input {...register('coverImage')} className="input w-full" placeholder="https://..." />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </form>
          {aiDialog && (
            <AIEnhancementDialog
              section={aiDialog.section}
              currentContent={aiDialog.content}
              onSave={(suggested) => {
                setValue(aiDialog.section === 'headline' ? 'headline' : 'bio', suggested)
                setAiDialog(null)
              }}
              onClose={() => setAiDialog(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ExperienceModal({ experience, onSave, onClose, isSaving }: { 
  experience?: Experience | null
  onSave: (data: ExperienceForm) => void
  onClose: () => void
  isSaving: boolean 
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ExperienceForm>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: experience?.title || '',
      company: experience?.company || '',
      location: experience?.location || '',
      startDate: experience?.startDate || '',
      endDate: experience?.endDate || '',
      isCurrent: experience?.isCurrent || false,
      description: experience?.description || '',
    },
  })

  const isCurrent = watch('isCurrent')
  const description = watch('description') || ''
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length
  const [aiDialog, setAiDialog] = useState<{ section: 'experience', content: string } | null>(null)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {experience ? 'Edit Experience' : 'Add Experience'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input {...register('title')} className="input w-full" placeholder="Software Engineer" />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
              <input {...register('company')} className="input w-full" placeholder="Company Name" />
              {errors.company && <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input {...register('location')} className="input w-full" placeholder="City, Country" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" {...register('startDate')} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" {...register('endDate')} className="input w-full" disabled={isCurrent} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('isCurrent')} id="isCurrent" className="rounded" />
              <label htmlFor="isCurrent" className="text-sm text-gray-700 dark:text-gray-300">I currently work here</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea {...register('description')} className="input w-full" rows={4} placeholder="Describe your responsibilities and achievements..." />
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  disabled={wordCount < 20}
                  onClick={() => setAiDialog({ section: 'experience', content: description })}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    wordCount < 20 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Rewrite with AI
                </button>
                {wordCount < 20 && (
                  <span className="text-[10px] text-gray-500 italic">
                    Add {20 - wordCount} more words to unlock AI assistance
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </form>
          {aiDialog && (
            <AIEnhancementDialog
              section="experience"
              currentContent={aiDialog.content}
              onSave={(suggested) => {
                setValue('description', suggested)
                setAiDialog(null)
              }}
              onClose={() => setAiDialog(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function EducationModal({ education, onSave, onClose, isSaving }: { 
  education?: Education | null
  onSave: (data: EducationForm) => void
  onClose: () => void
  isSaving: boolean 
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EducationForm>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      school: education?.school || '',
      degree: education?.degree || '',
      fieldOfStudy: education?.fieldOfStudy || '',
      startDate: education?.startDate || '',
      endDate: education?.endDate || '',
      description: education?.description || '',
    },
  })

  const [aiDialog, setAiDialog] = useState<{ section: 'education', content: string } | null>(null)
  const description = watch('description') || ''

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {education ? 'Edit Education' : 'Add Education'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School *</label>
              <input {...register('school')} className="input w-full" placeholder="University or School Name" />
              {errors.school && <p className="text-sm text-red-500 mt-1">{errors.school.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree</label>
              <input {...register('degree')} className="input w-full" placeholder="Bachelor's, Master's, etc." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</label>
              <input {...register('fieldOfStudy')} className="input w-full" placeholder="Computer Science, Business, etc." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" {...register('startDate')} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" {...register('endDate')} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea {...register('description')} className="input w-full" rows={4} placeholder="Activities, achievements, etc." />
              <button
                type="button"
                onClick={() => setAiDialog({ section: 'education', content: description })}
                className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Rewrite with AI
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </form>

          {aiDialog && (
            <AIEnhancementDialog
              section="education"
              currentContent={aiDialog.content}
              onSave={(suggested) => {
                setValue('description', suggested)
                setAiDialog(null)
              }}
              onClose={() => setAiDialog(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SkillModal({ onSave, onClose, isSaving }: { 
  onSave: (data: SkillForm) => void
  onClose: () => void
  isSaving: boolean 
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Skill</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill Name *</label>
              <input {...register('name')} className="input w-full" placeholder="e.g. JavaScript, Python, React" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select {...register('level')} className="input w-full">
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Skill
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function ProjectModal({ project, onSave, onClose, isSaving }: { 
  project?: Project | null
  onSave: (data: ProjectForm) => void
  onClose: () => void
  isSaving: boolean 
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      url: project?.url || '',
      technologies: project?.technologies?.join(', ') || '',
      startDate: project?.startDate || '',
      endDate: project?.endDate || '',
    },
  })

  const [aiDialog, setAiDialog] = useState<{ section: 'project', content: string } | null>(null)
  const description = watch('description') || ''

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {project ? 'Edit Project' : 'Add Project'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
              <input {...register('name')} className="input w-full" placeholder="My Awesome Project" />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea {...register('description')} className="input w-full" rows={4} placeholder="Describe your project..." />
              <button
                type="button"
                onClick={() => setAiDialog({ section: 'project', content: description })}
                className="mt-1 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Rewrite with AI
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project URL</label>
              <input {...register('url')} className="input w-full" placeholder="https://myproject.com" />
              {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technologies</label>
              <input {...register('technologies')} className="input w-full" placeholder="React, Node.js, PostgreSQL (comma-separated)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" {...register('startDate')} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input type="date" {...register('endDate')} className="input w-full" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </form>

          {aiDialog && (
            <AIEnhancementDialog
              section="project"
              currentContent={aiDialog.content}
              onSave={(suggested) => {
                setValue('description', suggested)
                setAiDialog(null)
              }}
              onClose={() => setAiDialog(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ScanProfileModal({ 
  onScan, 
  onClose, 
  isScanning, 
  targetRole, 
  setTargetRole, 
  targetLevel, 
  setTargetLevel 
}: { 
  onScan: () => void
  onClose: () => void
  isScanning: boolean
  targetRole: string
  setTargetRole: (val: string) => void
  targetLevel: string
  setTargetLevel: (val: string) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Scan Profile
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Our AI will analyze your profile and provide a matching score and feedback for your target role.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Role *</label>
              <input 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input w-full" 
                placeholder="e.g. Frontend Developer, Data Scientist" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Level</label>
              <select 
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="input w-full"
              >
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead/Staff">Lead / Staff</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button 
                onClick={onScan} 
                disabled={isScanning || !targetRole} 
                className="btn btn-primary flex-1 bg-gradient-to-r from-purple-600 to-primary text-white border-none"
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

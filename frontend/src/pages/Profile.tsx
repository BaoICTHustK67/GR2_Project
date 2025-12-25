import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usersAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { getInitials } from '@/lib/utils'
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
} from 'lucide-react'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'experience' | 'education' | 'skills' | 'projects'>('about')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const isOwnProfile = !id || id === String(currentUser?.id)

  useEffect(() => {
    if (isOwnProfile) {
      fetchOwnProfile()
    } else {
      fetchUserProfile()
    }
  }, [id, isOwnProfile])

  const fetchOwnProfile = async () => {
    try {
      const response = await usersAPI.getProfile()
      if (response.data.success) {
        setProfile(response.data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // If fetching profile fails, use the current user from store
      if (currentUser) {
        setProfile(currentUser as User)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getUser(Number(id))
      if (response.data.success) {
        setProfile(response.data.user)
        setIsConnected(response.data.isConnected || false)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!id) return
    setIsConnecting(true)
    try {
      await usersAPI.sendConnectionRequest(Number(id))
      setIsConnected(true)
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setIsConnecting(false)
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

  const tabs = [
    { id: 'about', label: 'About', icon: null },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />

        <div className="p-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
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
                    <Link to="/profile/edit" className="btn btn-primary">
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Link>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || isConnected}
                      className="btn btn-primary"
                    >
                      {isConnected ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Connected
                        </>
                      ) : isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
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

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'about' && <AboutSection profile={profile} />}
          {activeTab === 'experience' && <ExperienceSection experience={profile.experience || []} />}
          {activeTab === 'education' && <EducationSection education={profile.education || []} />}
          {activeTab === 'skills' && <SkillsSection skills={profile.skills || []} />}
          {activeTab === 'projects' && <ProjectsSection projects={profile.projects || []} />}
        </div>
      </div>
    </div>
  )
}

function AboutSection({ profile }: { profile: User }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        About
      </h2>
      {profile.bio ? (
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {profile.bio}
        </p>
      ) : (
        <p className="text-gray-500 italic">No bio added yet.</p>
      )}
    </div>
  )
}

function ExperienceSection({ experience }: { experience: User['experience'] }) {
  if (!experience || experience.length === 0) {
    return <p className="text-gray-500 italic">No experience added yet.</p>
  }

  return (
    <div className="space-y-6">
      {experience.map((exp, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {exp.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
            <p className="text-sm text-gray-500">
              {exp.startDate} - {exp.endDate || 'Present'}
            </p>
            {exp.description && (
              <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                {exp.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EducationSection({ education }: { education: User['education'] }) {
  if (!education || education.length === 0) {
    return <p className="text-gray-500 italic">No education added yet.</p>
  }

  return (
    <div className="space-y-6">
      {education.map((edu, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {edu.degree} in {edu.field}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{edu.school}</p>
            <p className="text-sm text-gray-500">
              {edu.startYear} - {edu.endYear || 'Present'}
            </p>
            {edu.description && (
              <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                {edu.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsSection({ skills }: { skills: User['skills'] }) {
  if (!skills || skills.length === 0) {
    return <p className="text-gray-500 italic">No skills added yet.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span
          key={index}
          className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
        >
          {skill.name}
        </span>
      ))}
    </div>
  )
}

function ProjectsSection({ projects }: { projects: User['projects'] }) {
  if (!projects || projects.length === 0) {
    return <p className="text-gray-500 italic">No projects added yet.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          {project.imageUrl && (
            <img
              src={project.imageUrl}
              alt={project.name}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}
          <h3 className="font-medium text-gray-900 dark:text-white">
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {project.description}
            </p>
          )}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.technologies.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          {(project.projectUrl || project.repoUrl) && (
            <div className="flex gap-2 mt-3">
              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Project
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Code
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

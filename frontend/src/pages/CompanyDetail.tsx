import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { companiesAPI } from '@/lib/api'
import type { Company, Job } from '@/types'
import { formatDate, formatSalary } from '@/lib/utils'
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Linkedin,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Loader2,
  ArrowLeft,
  UserPlus,
  UserCheck,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'jobs'>('about')
  const [followersCount, setFollowersCount] = useState(0)

  useEffect(() => {
    if (id) {
      fetchCompany()
      fetchCompanyJobs()
    }
  }, [id])

  const fetchCompany = async () => {
    try {
      const response = await companiesAPI.getCompany(Number(id))
      if (response.data.success) {
        setCompany(response.data.company)
        setIsFollowing(response.data.isFollowing || false)
        setFollowersCount(response.data.company.followersCount || 0)
      }
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompanyJobs = async () => {
    try {
      const response = await companiesAPI.getCompanyJobs(Number(id))
      if (response.data.success) {
        setJobs(response.data.jobs)
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error)
    }
  }

  const handleFollow = async () => {
    if (!id) return
    setIsFollowLoading(true)
    try {
      const response = await companiesAPI.toggleFollow(Number(id))
      if (response.data.success) {
        setIsFollowing(response.data.following)
        setFollowersCount(response.data.followersCount)
        if (response.data.following) {
          toast.success(`You are now following ${company?.name}`)
        } else {
          toast.success(`You unfollowed ${company?.name}`)
        }
      }
    } catch (error) {
      toast.error('Failed to update follow status')
      console.error('Error toggling follow:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Company not found
        </h3>
        <Link to="/companies" className="text-primary hover:underline">
          Back to Companies
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Companies
      </Link>

      {/* Company Header */}
      <div className="card overflow-hidden">
        {/* Cover Image */}
        <div 
          className="h-40 bg-cover bg-center"
          style={{
            backgroundImage: company.coverImage 
              ? `url(${company.coverImage})` 
              : 'linear-gradient(to right, var(--primary), var(--primary-light))',
            backgroundColor: '#BF3131',
          }}
        />

        <div className="p-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-24 h-24 rounded-lg border-4 border-white dark:border-gray-900 object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg border-4 border-white dark:border-gray-900 bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-8 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {company.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {company.industry}
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`btn ${isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                {/* Followers Count */}
                <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                  <UserCheck className="w-4 h-4 text-primary" />
                  {followersCount} {followersCount === 1 ? 'Follower' : 'Followers'}
                </span>
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {company.location}
                  </span>
                )}
                {company.companySize && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {company.companySize} employees
                  </span>
                )}
                {company.foundedYear && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Founded {company.foundedYear}
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {company.linkedin && (
                  <a
                    href={company.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    Contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Jobs
            {jobs.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {jobs.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'about' ? (
            <div className="space-y-6">
              {/* Description */}
              {company.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    About {company.name}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {company.description}
                  </p>
                </div>
              )}

              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company.foundedYear && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Founded</h3>
                    <p className="text-gray-900 dark:text-white">{company.foundedYear}</p>
                  </div>
                )}
                {company.companySize && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Company Size</h3>
                    <p className="text-gray-900 dark:text-white">{company.companySize}</p>
                  </div>
                )}
                {company.industry && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Industry</h3>
                    <p className="text-gray-900 dark:text-white">{company.industry}</p>
                  </div>
                )}
                {company.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Headquarters</h3>
                    <p className="text-gray-900 dark:text-white">{company.location}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No open positions at the moment.
                </p>
              ) : (
                jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.jobType}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(job.postedDate || job.createdAt || new Date())}
                          </span>
                        </div>
                        {(job.salaryMin || job.salaryMax) && (
                          <p className="mt-2 text-primary font-medium">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

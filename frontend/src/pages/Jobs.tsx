import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '@/lib/api'
import type { Job } from '@/types'
import { formatDate, formatSalary } from '@/lib/utils'
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  BarChart3,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [recommendations, setRecommendations] = useState<Job[]>([])
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const [isRecLoading, setIsRecLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchJobs()
    fetchRecommendations()
  }, [currentPage, searchQuery, locationFilter, jobTypeFilter])

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const response = await jobsAPI.getJobs({
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
        search: searchQuery,
        location: locationFilter,
        jobType: jobTypeFilter,
      })

      if (response.data.success) {
        setJobs(response.data.jobs)
        setTotalPages(response.data.pages)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    setIsRecLoading(true)
    try {
      const response = await jobsAPI.getRecommendations()
      if (response.data.success) {
        setRecommendations(response.data.jobs || [])
        setIsProfileComplete(response.data.isProfileComplete !== false)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setIsRecLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchJobs()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Recommended for You
          </h2>
          {!isProfileComplete && (
            <Link to="/profile" className="text-sm text-primary hover:underline">
              Complete Profile
            </Link>
          )}
        </div>

        {isRecLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-80 h-32 card animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : !isProfileComplete ? (
          <div className="card p-6 border-dashed border-2 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-primary/10 mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium">Personalize your job hunt</p>
            <p className="text-sm text-gray-500 mb-4">Add skills, experience, or projects to your profile to get tailored recommendations.</p>
            <Link to="/profile" className="btn btn-primary btn-sm">Complete Profile</Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 text-sm">
            We couldn't find any specific matches for your profile yet. Try adding more skills.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {recommendations.map((job) => (
              <div key={job.id} className="flex-shrink-0 w-80">
                <Link to={`/jobs/${job.id}`} className="card p-4 block hover:shadow-md transition-shadow h-full">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {job.company?.logo ? (
                        <img src={job.company.logo} alt={job.company.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{job.company?.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1 text-primary font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Location Filter */}
          <div className="md:w-48">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input"
            >
              <option value="">All Locations</option>
              <option value="Ho Chi Minh City">Ho Chi Minh City</option>
              <option value="Hanoi">Hanoi</option>
              <option value="Da Nang">Da Nang</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="md:w-48">
            <select
              value={jobTypeFilter}
              onChange={(e) => {
                setJobTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-8 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-ghost disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-ghost disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function JobCard({ job }: { job: Job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="card p-6 block hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary">
            {job.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{job.company?.name}</p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
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
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {job.applicantCount} applicants
            </span>
          </div>

          {/* Salary */}
          <p className="mt-2 text-primary font-medium">
            {formatSalary(job.salaryMin, job.salaryMax)}
          </p>
        </div>

        {/* Quick Apply Button */}
        <div className="flex-shrink-0 self-center">
          <span className="btn btn-primary">View Details</span>
        </div>
      </div>
    </Link>
  )
}

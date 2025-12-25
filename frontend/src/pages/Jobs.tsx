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
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchJobs()
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchJobs()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search & Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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

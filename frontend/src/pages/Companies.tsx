import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { companiesAPI } from '@/lib/api'
import type { Company } from '@/types'
import {
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const ITEMS_PER_PAGE = 12

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCompanies()
  }, [currentPage, searchQuery, industryFilter])

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const response = await companiesAPI.getCompanies({
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
        search: searchQuery,
        industry: industryFilter,
      })

      if (response.data.success) {
        setCompanies(response.data.companies)
        setTotalPages(response.data.pages)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCompanies()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Companies
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover companies and explore career opportunities
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Industry Filter */}
          <div className="md:w-48">
            <select
              value={industryFilter}
              onChange={(e) => {
                setIndustryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="input"
            >
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : companies.length === 0 ? (
        <div className="card p-8 text-center">
          <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No companies found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
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

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      to={`/companies/${company.id}`}
      className="card p-6 block hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {company.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {company.industry}
          </p>
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {company.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        {company.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {company.location}
          </span>
        )}
        {company.size && (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {company.size}
          </span>
        )}
      </div>

      {/* Job Count */}
      {company.jobCount !== undefined && company.jobCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
            <Briefcase className="w-4 h-4" />
            {company.jobCount} open position{company.jobCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Link>
  )
}

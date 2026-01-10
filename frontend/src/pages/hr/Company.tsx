import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { companiesAPI, authAPI } from '@/lib/api'
import { 
  Building2, 
  Search, 
  Plus, 
  Clock, 
  Users,
  MapPin,
  Globe,
  Briefcase,
  Loader2,
  AlertCircle,
  X,
  Edit,
  Trash2,
  UserPlus,
  Check
} from 'lucide-react'

interface Company {
  id: number
  name: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: string
  location?: string
  founded?: number
  followersCount: number
  hrCount?: number
  createdBy?: number
}

interface JoinRequest {
  id: number
  userId: number
  companyId: number
  status: string
  message?: string
  createdAt: string
  company: Company
  requester?: {
    id: number
    name: string
    email: string
    image?: string
  }
}

interface HRMember {
  id: number
  name: string
  email: string
  image?: string
}

export default function HRCompany() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'search' | 'register'>('search')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Company state
  const [myCompany, setMyCompany] = useState<Company | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Pending request state
  const [pendingRequest, setPendingRequest] = useState<JoinRequest | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [searching, setSearching] = useState(false)
  
  // Join request state
  const [joiningCompanyId, setJoiningCompanyId] = useState<number | null>(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  
  // Register state
  const [registering, setRegistering] = useState(false)
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    founded: ''
  })

  // Join requests for admin
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // HR Members state
  const [hrMembers, setHrMembers] = useState<HRMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [adminId, setAdminId] = useState<number | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  // Edit company modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    logo: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    founded: ''
  })
  const [saving, setSaving] = useState(false)

  // Search and add HR users state
  const [hrUserSearchQuery, setHrUserSearchQuery] = useState('')
  const [hrUserSearchResults, setHrUserSearchResults] = useState<HRMember[]>([])
  const [searchingHrUsers, setSearchingHrUsers] = useState(false)
  const [addingUserId, setAddingUserId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Check if user has a company
      if (user?.companyId) {
        const response = await companiesAPI.getMyCompany()
        if (response.data.success) {
          setMyCompany(response.data.company)
          setIsAdmin(response.data.isAdmin)
          
          // If admin, load join requests and HR members
          if (response.data.isAdmin) {
            loadJoinRequests()
            loadHRMembers()
          }
        }
      } else {
        // Check for pending join request
        try {
          const reqResponse = await companiesAPI.getMyJoinRequest()
          if (reqResponse.data.success) {
            setPendingRequest(reqResponse.data.joinRequest)
          }
        } catch {
          // No pending request - that's fine
        }
      }
    } catch (err: any) {
      console.error('Error loading company data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadJoinRequests = async () => {
    setLoadingRequests(true)
    try {
      const response = await companiesAPI.getJoinRequests('pending')
      if (response.data.success) {
        setJoinRequests(response.data.requests)
      }
    } catch (err) {
      console.error('Error loading join requests:', err)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    try {
      const response = await companiesAPI.searchCompanies(searchQuery)
      if (response.data.success) {
        setSearchResults(response.data.companies)
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const openJoinModal = (company: Company) => {
    setSelectedCompany(company)
    setJoinMessage('')
    setShowJoinModal(true)
  }

  const handleRequestJoin = async () => {
    if (!selectedCompany) return
    
    setJoiningCompanyId(selectedCompany.id)
    try {
      const response = await companiesAPI.requestJoinCompany(selectedCompany.id, joinMessage)
      if (response.data.success) {
        setPendingRequest(response.data.joinRequest)
        setShowJoinModal(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send join request')
    } finally {
      setJoiningCompanyId(null)
    }
  }

  const handleCancelRequest = async () => {
    try {
      const response = await companiesAPI.cancelJoinRequest()
      if (response.data.success) {
        setPendingRequest(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel request')
    }
  }

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyForm.name.trim()) {
      setError('Company name is required')
      return
    }
    
    setRegistering(true)
    setError('')
    
    try {
      const response = await companiesAPI.createCompany({
        ...companyForm,
        founded: companyForm.founded ? parseInt(companyForm.founded) : null
      })
      
      if (response.data.success) {
        setMyCompany(response.data.company)
        setIsAdmin(true)
        
        // Update user in auth store
        if (response.data.user) {
          setUser(response.data.user)
        } else {
          // Refresh user data
          const userResponse = await authAPI.getCurrentUser()
          if (userResponse.data.success) {
            setUser(userResponse.data.user)
          }
        }
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(err.response.data.message)
        // Switch to search tab and show the existing company
        setActiveTab('search')
        if (err.response.data.existingCompany) {
          setSearchResults([err.response.data.existingCompany])
        }
      } else {
        setError(err.response?.data?.message || 'Failed to register company')
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleReviewRequest = async (requestId: number, action: 'approve' | 'reject') => {
    try {
      const response = await companiesAPI.reviewJoinRequest(requestId, action)
      if (response.data.success) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId))
        // Refresh HR members list if approved
        if (action === 'approve') {
          loadHRMembers()
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to review request')
    }
  }

  // Load HR members
  const loadHRMembers = async () => {
    setLoadingMembers(true)
    try {
      const response = await companiesAPI.getHRMembers()
      if (response.data.success) {
        setHrMembers(response.data.members)
        setAdminId(response.data.adminId)
      }
    } catch (err) {
      console.error('Error loading HR members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  // Remove HR member from company
  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this HR member from the company?')) {
      return
    }
    
    setRemovingMemberId(userId)
    try {
      const response = await companiesAPI.removeHRMember(userId)
      if (response.data.success) {
        setHrMembers(prev => prev.filter(m => m.id !== userId))
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove HR member')
    } finally {
      setRemovingMemberId(null)
    }
  }

  // Search for HR users to add
  const handleSearchHRUsers = async () => {
    if (hrUserSearchQuery.trim().length < 2) {
      setHrUserSearchResults([])
      return
    }
    
    setSearchingHrUsers(true)
    try {
      const response = await companiesAPI.searchHRUsers(hrUserSearchQuery)
      if (response.data.success) {
        setHrUserSearchResults(response.data.users)
      }
    } catch (err) {
      console.error('Error searching HR users:', err)
    } finally {
      setSearchingHrUsers(false)
    }
  }

  // Effect for HR user search debounce
  useEffect(() => {
    if (!isAdmin) return
    const debounce = setTimeout(() => {
      if (hrUserSearchQuery.trim().length >= 2) {
        handleSearchHRUsers()
      } else {
        setHrUserSearchResults([])
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [hrUserSearchQuery, isAdmin])

  // Add HR user directly to company
  const handleAddHRUser = async (userId: number) => {
    setAddingUserId(userId)
    try {
      const response = await companiesAPI.addHRMember(userId)
      if (response.data.success) {
        // Add to members list
        setHrMembers(prev => [...prev, response.data.user])
        // Remove from search results
        setHrUserSearchResults(prev => prev.filter(u => u.id !== userId))
        // Clear search
        setHrUserSearchQuery('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add HR member')
    } finally {
      setAddingUserId(null)
    }
  }

  // Open edit company modal
  const openEditModal = () => {
    if (myCompany) {
      setEditForm({
        name: myCompany.name || '',
        description: myCompany.description || '',
        logo: myCompany.logo || '',
        website: myCompany.website || '',
        industry: myCompany.industry || '',
        size: myCompany.size || '',
        location: myCompany.location || '',
        founded: myCompany.founded?.toString() || ''
      })
      setShowEditModal(true)
    }
  }

  // Save company profile
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!myCompany) return
    
    setSaving(true)
    setError('')
    
    try {
      const response = await companiesAPI.updateCompany(myCompany.id, {
        ...editForm,
        founded: editForm.founded ? parseInt(editForm.founded) : null
      })
      
      if (response.data.success) {
        setMyCompany(response.data.company)
        setShowEditModal(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update company')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user already has a company, show company info
  if (myCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Company</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your company profile and team
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {/* Company Card */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              {myCompany.logo ? (
                <img src={myCompany.logo} alt={myCompany.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{myCompany.name}</h2>
                  {isAdmin && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">Admin</span>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
              {myCompany.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{myCompany.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {myCompany.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {myCompany.industry}
                  </span>
                )}
                {myCompany.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {myCompany.location}
                  </span>
                )}
                {myCompany.website && (
                  <a href={myCompany.website} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-1 text-primary hover:underline">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                {myCompany.hrCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {myCompany.hrCount} HR member{myCompany.hrCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HR Members List (for admin only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              HR Team Members
            </h3>
            
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : hrMembers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No HR members yet
              </p>
            ) : (
              <div className="space-y-3">
                {hrMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
                          {member.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          {member.id === adminId && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member.id !== adminId && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMemberId === member.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add HR Users (for admin only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add HR Members
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Search and directly add HR users to your company team.
            </p>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search HR users by name or email..."
                value={hrUserSearchQuery}
                onChange={(e) => setHrUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              {searchingHrUsers && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
            </div>

            {hrUserSearchQuery.length > 0 && hrUserSearchQuery.length < 2 && (
              <p className="text-sm text-gray-500 mb-4">Type at least 2 characters to search</p>
            )}

            {hrUserSearchResults.length > 0 && (
              <div className="space-y-3">
                {hrUserSearchResults.map(hrUser => (
                  <div key={hrUser.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {hrUser.image ? (
                        <img src={hrUser.image} alt={hrUser.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
                          {hrUser.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {hrUser.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {hrUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddHRUser(hrUser.id)}
                      disabled={addingUserId === hrUser.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {addingUserId === hrUser.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Add to Team
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hrUserSearchQuery.length >= 2 && !searchingHrUsers && hrUserSearchResults.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No available HR users found matching your search
              </p>
            )}
          </div>
        )}

        {/* Join Requests (for admin only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pending Join Requests
            </h3>
            
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : joinRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No pending join requests
              </p>
            ) : (
              <div className="space-y-4">
                {joinRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-medium">
                        {request.requester?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.requester?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.requester?.email}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewRequest(request.id, 'approve')}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReviewRequest(request.id, 'reject')}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Company Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1A1C20] rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Edit Company Profile
              </h3>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industry
                    </label>
                    <select
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Select industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Media">Media</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Size
                    </label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      value={editForm.founded}
                      onChange={(e) => setEditForm({ ...editForm, founded: e.target.value })}
                      placeholder="e.g., 2020"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // If user has a pending request
  if (pendingRequest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Association</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your join request is pending approval
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Request Pending
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                You have requested to join <strong>{pendingRequest.company?.name}</strong>. 
                A company admin will review your request.
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                Requested on {new Date(pendingRequest.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={handleCancelRequest}
                className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show search/register tabs
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Association</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Join an existing company or register a new one to start posting jobs
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Search Existing Company
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Register New Company
        </button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for your company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-gray-500">Type at least 2 characters to search</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map(company => (
                <div
                  key={company.id}
                  className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                      <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {company.industry && <span>{company.industry}</span>}
                        {company.location && <span>• {company.location}</span>}
                        {company.hrCount !== undefined && (
                          <span>• {company.hrCount} HR member{company.hrCount !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openJoinModal(company)}
                    disabled={joiningCompanyId === company.id}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {joiningCompanyId === company.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Request to Join'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No companies found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try a different search or{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-primary hover:underline"
                >
                  register your company
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Register Tab */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterCompany} className="space-y-4">
          <div className="bg-white dark:bg-[#1A1C20] border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Enter company name"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder="Tell us about your company"
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Industry
                </label>
                <select
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Media">Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Size
                </label>
                <select
                  value={companyForm.size}
                  onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={companyForm.location}
                  onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={companyForm.founded}
                  onChange={(e) => setCompanyForm({ ...companyForm, founded: e.target.value })}
                  placeholder="e.g., 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={companyForm.logo}
                onChange={(e) => setCompanyForm({ ...companyForm, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {registering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                Register Company
              </>
            )}
          </button>
        </form>
      )}

      {/* Join Request Modal */}
      {showJoinModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1C20] rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Request to Join {selectedCompany.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your request will be sent to the company admin for approval.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message (optional)
              </label>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="Introduce yourself or explain why you want to join..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestJoin}
                disabled={joiningCompanyId === selectedCompany.id}
                className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joiningCompanyId === selectedCompany.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

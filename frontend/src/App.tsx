import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Layouts
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import HRLayout from '@/layouts/HRLayout'

// Pages
import SignIn from '@/pages/auth/SignIn'
import SignUp from '@/pages/auth/SignUp'
import Feed from '@/pages/Feed'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import Interviews from '@/pages/Interviews'
import Profile from '@/pages/Profile'
import Companies from '@/pages/Companies'
import CompanyDetail from '@/pages/CompanyDetail'
import HRDashboard from '@/pages/hr/Dashboard'
import HRJobs from '@/pages/hr/Jobs'
import CreateJob from '@/pages/hr/CreateJob'
import HRCompany from '@/pages/hr/Company'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }
  
  return <>{children}</>
}

// HR Protected Route
function HRRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }
  
  if (user?.userRole !== 'hr' && user?.userRole !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Route>

      {/* Main App Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Feed />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyDetail />} />
      </Route>

      {/* HR Routes */}
      <Route path="/hr" element={<HRRoute><HRLayout /></HRRoute>}>
        <Route index element={<Navigate to="/hr/dashboard" replace />} />
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="jobs" element={<HRJobs />} />
        <Route path="jobs/create" element={<CreateJob />} />
        <Route path="jobs/:id/edit" element={<CreateJob />} />
        <Route path="company" element={<HRCompany />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary-light/20 dark:from-gray-900 dark:via-gray-800 dark:to-primary-dark/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">HustConnect</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your Professional Network
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="card p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          © 2024 HustConnect. All rights reserved.
        </p>
      </div>
    </div>
  )
}

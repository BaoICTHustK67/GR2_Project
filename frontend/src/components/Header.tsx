import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { 
  Home, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  Building2
} from 'lucide-react'
import { useState } from 'react'
import UserMenu from './UserMenu'

const navLinks = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/companies', label: 'Companies', icon: Building2 },
]

export default function Header() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useThemeStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isHR = user?.userRole === 'hr' || user?.userRole === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Hust</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Connect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{link.label}</span>
                </Link>
              )
            })}

            {isHR && (
              <Link
                to="/hr/dashboard"
                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                  location.pathname.startsWith('/hr')
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs mt-1">HR</span>
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            {isHR && (
              <Link
                to="/hr/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  location.pathname.startsWith('/hr')
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>HR Dashboard</span>
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

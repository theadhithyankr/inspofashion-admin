import { Menu, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'
import { ToggleSwitch } from '../products/ToggleSwitch'

export function Header({ onMenuClick }) {
  const { user, signOut } = useAuth()
  const { isDark, setIsDark } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sun className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-amber-500'}`} />
              <ToggleSwitch
                enabled={isDark}
                onChange={setIsDark}
                aria-label="Toggle dark mode"
              />
              <Moon className={`w-4 h-4 ${isDark ? 'text-indigo-300' : 'text-gray-400'}`} />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

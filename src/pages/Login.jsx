import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <LoginForm />
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { authAPI } from '@/lib/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      const response = await authAPI.forgotPassword(data.email)
      
      if (response.data.success) {
        setIsSubmitted(true)
        toast.success('Check your email for reset instructions')
      } else {
        toast.error(response.data.message || 'Failed to send reset email')
      }
    } catch (error: any) {
      // Still show success for security (don't reveal if email exists)
      setIsSubmitted(true)
      toast.success('Check your email for reset instructions')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Check Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          If an account exists with that email address, we've sent you a link to reset your password.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          The link will expire in 1 hour.
        </p>
        <Link 
          to="/sign-in" 
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link 
        to="/sign-in" 
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>

      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-6 h-6 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Forgot Password?
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        No worries, we'll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            className="input"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  )
}

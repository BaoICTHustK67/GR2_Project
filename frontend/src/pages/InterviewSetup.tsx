import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { interviewsAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
  Video,
  Loader2,
  BrainCircuit,
  Code2,
  Briefcase,
  GraduationCap,
  ArrowRight
} from 'lucide-react'

interface SetupFormData {
  role: string
  level: string
  techstack: string
  type: string
}

export default function InterviewSetup() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<SetupFormData>({
    defaultValues: {
      role: '',
      level: 'junior',
      techstack: '',
      type: 'mixed'
    }
  })

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true)
    try {
      // In a real app, you might validate with the backend first/check credits, etc.
      const response = await interviewsAPI.generateInterview(data)
      
      if (response.data.success) {
        toast.success('Interview generated successfully!')
        navigate('/interviews')
      } else {
        toast.error(response.data.error || 'Failed to generate interview')
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error(error.response?.data?.error || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Setup Your AI Interview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your practice session. Our AI will generate unique questions based on your profile.
        </p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Role */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Briefcase className="w-4 h-4" />
              Target Role
            </label>
            <input
              {...register('role', { required: 'Role is required' })}
              type="text"
              placeholder="e.g. Frontend Developer, Data Scientist"
              className="input w-full"
            />
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Code2 className="w-4 h-4" />
              Tech Stack
            </label>
            <textarea
              {...register('techstack', { required: 'Tech stack is required' })}
              placeholder="e.g. React, Node.js, TypeScript, AWS (separated by commas)"
              className="input w-full h-24 resize-none pt-2"
            />
            <p className="text-xs text-gray-500">
              List the technologies you want to be tested on.
            </p>
            {errors.techstack && (
              <p className="text-xs text-red-500">{errors.techstack.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Level */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <GraduationCap className="w-4 h-4" />
                Experience Level
              </label>
              <select
                {...register('level')}
                className="input w-full"
              >
                <option value="intern">Intern</option>
                <option value="junior">Junior (0-2 years)</option>
                <option value="mid">Mid-Level (2-5 years)</option>
                <option value="senior">Senior (5+ years)</option>
                <option value="lead">Lead / Manager</option>
              </select>
            </div>

            {/* Interview Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Video className="w-4 h-4" />
                Interview Focus
              </label>
              <select
                {...register('type')}
                className="input w-full"
              >
                <option value="mixed">Mixed (Technical & Behavioral)</option>
                <option value="technical">Technical Only</option>
                <option value="behavioral">Behavioral Only</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 text-lg mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                Start Interview Session
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

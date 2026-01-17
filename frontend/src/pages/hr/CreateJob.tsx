import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { jobsAPI } from '@/lib/api'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Briefcase,
} from 'lucide-react'

const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  location: z.string().min(2, 'Location is required'),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  responsibilities: z.array(z.string()).min(1, 'Add at least one responsibility'),
  requirements: z.array(z.string()).min(1, 'Add at least one requirement'),
  benefits: z.array(z.string()),
  techStack: z.array(z.string()),
})

type JobFormData = z.infer<typeof jobSchema>

export default function CreateJob() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      responsibilities: [''],
      requirements: [''],
      benefits: [],
      techStack: [],
    },
  })

  const {
    fields: responsibilityFields,
    append: appendResponsibility,
    remove: removeResponsibility,
  } = useFieldArray({ control, name: 'responsibilities' } as any)

  const {
    fields: requirementFields,
    append: appendRequirement,
    remove: removeRequirement,
  } = useFieldArray({ control, name: 'requirements' } as any)

  const {
    fields: benefitFields,
    append: appendBenefit,
    remove: removeBenefit,
  } = useFieldArray({ control, name: 'benefits' } as any)

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)
    try {
      const response = await jobsAPI.createJob({
        ...data,
        responsibilities: data.responsibilities.filter(Boolean),
        requirements: data.requirements.filter(Boolean),
        benefits: data.benefits.filter(Boolean),
      })

      if (response.data.success) {
        toast.success('Job posted successfully!')
        navigate('/hr/jobs')
      } else {
        toast.error(response.data.message || 'Failed to post job')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post job')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Post New Job
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new job listing for your company
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Basic Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="input"
              placeholder="e.g., Senior React Developer"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                {...register('location')}
                className="input"
                placeholder="e.g., Ho Chi Minh City"
              />
              {errors.location && (
                <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Type *
              </label>
              <select {...register('jobType')} className="input">
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Experience Level *
            </label>
            <select {...register('experienceLevel')} className="input">
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead / Manager</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Salary (USD)
              </label>
              <input
                type="number"
                {...register('salaryMin', { valueAsNumber: true })}
                className="input"
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Salary (USD)
              </label>
              <input
                type="number"
                {...register('salaryMax', { valueAsNumber: true })}
                className="input"
                placeholder="e.g., 80000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Description *
            </label>
            <textarea
              {...register('description')}
              className="input"
              rows={6}
              placeholder="Describe the role, team, and what the candidate will be working on..."
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Responsibilities *
            </h2>
            <button
              type="button"
              onClick={() => appendResponsibility('')}
              className="btn btn-ghost text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {responsibilityFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                {...register(`responsibilities.${index}` as const)}
                className="input flex-1"
                placeholder="e.g., Develop and maintain React applications"
              />
              {responsibilityFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeResponsibility(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          {errors.responsibilities && (
            <p className="text-sm text-red-500">{errors.responsibilities.message}</p>
          )}
        </div>

        {/* Requirements */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Requirements *
            </h2>
            <button
              type="button"
              onClick={() => appendRequirement('')}
              className="btn btn-ghost text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {requirementFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                {...register(`requirements.${index}` as const)}
                className="input flex-1"
                placeholder="e.g., 3+ years of experience with React"
              />
              {requirementFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          {errors.requirements && (
            <p className="text-sm text-red-500">{errors.requirements.message}</p>
          )}
        </div>

        {/* Benefits */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Benefits
            </h2>
            <button
              type="button"
              onClick={() => appendBenefit('')}
              className="btn btn-ghost text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {benefitFields.length === 0 ? (
            <p className="text-gray-500 text-sm">No benefits added yet. Click "Add" to add benefits.</p>
          ) : (
            benefitFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  {...register(`benefits.${index}` as const)}
                  className="input flex-1"
                  placeholder="e.g., Health insurance, 401k matching"
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Job'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

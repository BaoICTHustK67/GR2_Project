import { RoadmapStep } from '@/lib/roadmapApi'
import { CheckCircle2, Circle, Lock } from 'lucide-react'

interface LearningGraphProps {
  steps: RoadmapStep[]
  onStepClick: (step: RoadmapStep) => void
  readOnly?: boolean
}

export function LearningGraph({ steps, onStepClick, readOnly = false }: LearningGraphProps) {
  return (
    <div className="max-w-2xl mx-auto py-8">
      {steps.map((step, index) => {
        const isCompleted = step.completed
        const isCurrent = !isCompleted && (index === 0 || steps[index - 1].completed)
        const isLocked = !isCompleted && !isCurrent && !readOnly
        
        return (
          <div key={step.id} className="relative pl-12 pb-12 last:pb-0">
            {/* Connecting Line */}
            {index !== steps.length - 1 && (
              <div 
                className={`absolute left-[19px] top-10 bottom-0 w-0.5 
                  ${isCompleted ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} 
              />
            )}
            
            {/* Node Icon */}
            <div 
              className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all bg-white dark:bg-[#1A1C20] z-10
                ${isCompleted 
                  ? 'border-blue-600 text-blue-600' 
                  : isCurrent 
                    ? 'border-blue-200 dark:border-blue-900 animate-pulse'
                    : 'border-gray-200 dark:border-gray-800 text-gray-300'
                }
              `}
            >
              <div 
                className={`w-3 h-3 rounded-full 
                  ${isCompleted ? 'bg-blue-600' : isCurrent ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-700'}`} 
              />
            </div>

            {/* Content Card */}
            <div 
              onClick={() => !isLocked && onStepClick(step)}
              className={`
                relative bg-white dark:bg-[#1A1C20] border rounded-xl p-5 transition-all
                ${isLocked 
                  ? 'opacity-60 cursor-not-allowed border-gray-200 dark:border-gray-800' 
                  : 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
                }
                ${isCurrent ? 'ring-2 ring-blue-100 dark:ring-blue-900 border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className={`font-bold text-lg ${isCompleted ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                        {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                        {step.duration}
                    </p>
                </div>
                {isCompleted ? (
                   <CheckCircle2 className="w-6 h-6 text-blue-600" />
                ) : isLocked ? (
                   <Lock className="w-5 h-5 text-gray-400" />
                ) : (
                   <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {step.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {step.skills.slice(0, 3).map((skill, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {skill}
                  </span>
                ))}
                {step.skills.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                        +{step.skills.length - 3}
                    </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

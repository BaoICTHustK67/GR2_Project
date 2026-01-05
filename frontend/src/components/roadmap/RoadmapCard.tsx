import { Map, Clock, Trophy, ChevronRight } from 'lucide-react'
import { RoadmapTemplate, UserRoadmap } from '@/lib/roadmapApi'

interface RoadmapCardProps {
  roadmap?: UserRoadmap
  template?: RoadmapTemplate
  onClick?: () => void
}

export function RoadmapCard({ roadmap, template, onClick }: RoadmapCardProps) {
  const data = roadmap || template
  if (!data) return null

  const isUserRoadmap = !!roadmap
  const title = isUserRoadmap ? roadmap.title : template?.role
  const subtitle = isUserRoadmap 
    ? `${roadmap.targetLevel} • ${roadmap.progress}% Complete` 
    : template?.level
  
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-[#1A1C20] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Access via Link if it's a user roadmap, otherwise just a visual card that might open a modal or detail page */}
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {isUserRoadmap ? <Trophy className="w-5 h-5" /> : <Map className="w-5 h-5" />}
          </div>
          {isUserRoadmap && (
             <span className={`text-xs font-medium px-2 py-1 rounded-full ${
               roadmap.progress === 100
                 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                 : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
             }`}>
               {roadmap.progress === 100 ? 'Completed' : 'Active'}
             </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {subtitle}
        </p>

        {isUserRoadmap ? (
          <div className="mt-4">
             <div className="flex justify-between text-xs mb-1">
               <span className="text-gray-500">Progress</span>
               <span className="font-medium text-gray-900 dark:text-white">{roadmap.progress}%</span>
             </div>
             <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
               <div 
                 className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                 style={{ width: `${roadmap.progress}%` }}
               />
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {template?.estimatedDuration}
            </div>
            <div className="flex items-center gap-1">
              <Map className="w-3.5 h-3.5" />
              {template?.steps.length} Steps
            </div>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {isUserRoadmap ? 'Continue Learning' : 'View Roadmap'}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

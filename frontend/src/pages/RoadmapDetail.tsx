import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, CheckCircle2, Circle, ExternalLink, Loader2 } from 'lucide-react'
import { roadmapApi, UserRoadmap, RoadmapStep } from '@/lib/roadmapApi'
import { LearningGraph } from '@/components/roadmap/LearningGraph'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import CongratulationModal from '@/components/roadmap/CongratulationModal'
import toast from 'react-hot-toast'

export default function RoadmapDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState<UserRoadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStep, setSelectedStep] = useState<RoadmapStep | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCongratulation, setShowCongratulation] = useState(false)

  useEffect(() => {
    if (id) fetchRoadmap(parseInt(id))
  }, [id])

  const fetchRoadmap = async (roadmapId: number) => {
    try {
      // Since /my returns all, we can filter or maybe add a specific get endpoint later
      // For now, let's assume getTemplates returns templates only, so for USER roadmaps
      // we might need to filter from getMyRoadmaps or add a specific endpoint. 
      // WAIT, I missed adding a specific GET /roadmaps/<id> endpoint in backend for USER roadmaps?
      // Actually backend `get_my_roadmaps` returns list.
      // Let's rely on finding it in the list for now or I should have added GET /api/roadmaps/<id>
      // Oh, I only added GET /api/roadmaps/templates/<id> :facepalm:
      // Quick fix: fetch all user roadmaps and filter. Efficient? No. Works? Yes for now.
      
      const response = await roadmapApi.getMyRoadmaps()
      if (response.data.success) {
         const found = response.data.roadmaps.find(r => r.id === roadmapId)
         if (found) {
             setRoadmap(found)
         } else {
             toast.error('Roadmap not found')
             navigate('/roadmaps')
         }
      }
    } catch (error) {
      console.error('Failed to load roadmap:', error)
      toast.error('Failed to load roadmap')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!roadmap || !window.confirm('Are you sure you want to delete this roadmap?')) return
    try {
      await roadmapApi.deleteRoadmap(roadmap.id)
      toast.success('Roadmap deleted')
      navigate('/roadmaps')
    } catch (error) {
       toast.error('Failed to delete roadmap')
    }
  }

  const handleToggleStep = async (stepId: string) => {
    if (!roadmap) return
    setIsUpdating(true)
    
    // Toggle completion status
    const updatedSteps = roadmap.steps.map(s => 
        s.id === stepId ? { ...s, completed: !s.completed } : s
    )

    try {
       const response = await roadmapApi.updateProgress(roadmap.id, updatedSteps)
       if (response.data.success) {
           const updatedRoadmap = response.data.roadmap
           setRoadmap(updatedRoadmap)
           
           // If selected step was updated, update modal state too
           if (selectedStep?.id === stepId) {
               setSelectedStep({ ...selectedStep, completed: !selectedStep.completed })
           }
           
           // Check for completion
           if (updatedRoadmap.progress === 100 && !roadmap.progress || (roadmap.progress < 100 && updatedRoadmap.progress === 100)) {
               setShowCongratulation(true)
           }
           
           toast.success('Progress updated')
       }
    } catch (error) {
        toast.error('Failed to update progress')
    } finally {
        setIsUpdating(false)
    }
  }

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading roadmap...</div>
  if (!roadmap) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/roadmaps')}
        className="flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Roadmaps
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
         {/* Background decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

         <div className="flex justify-between items-start relative z-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{roadmap.title}</h1>
                <p className="text-gray-500 flex items-center gap-3">
                   {roadmap.targetLevel} • {roadmap.progress}% Completed
                </p>
            </div>
            <button 
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Roadmap"
            >
                <Trash2 className="w-5 h-5" />
            </button>
         </div>

         {/* Progress Bar */}
         <div className="mt-6">
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
               <div 
                 className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-700 relative"
                 style={{ width: `${roadmap.progress}%` }}
               >
                 <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white shadow-md rounded-full" />
               </div>
            </div>
         </div>
      </div>

      {/* Graph */}
      <div className="bg-white dark:bg-[#1A1C20] rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Learning Path</h2>
        <LearningGraph 
          steps={roadmap.steps} 
          onStepClick={setSelectedStep}
        />
      </div>

      {/* Step Detail Modal */}
      <StepDetailModal 
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        step={selectedStep}
        onToggleComplete={handleToggleStep}
        isUpdating={isUpdating}
      />

      <CongratulationModal
        isOpen={showCongratulation}
        onClose={() => setShowCongratulation(false)}
        title={roadmap.title}
      />
    </div>
  )
}

function StepDetailModal({ 
    isOpen, onClose, step, onToggleComplete, isUpdating 
}: { 
    isOpen: boolean
    onClose: () => void
    step: RoadmapStep | null
    onToggleComplete: (id: string) => void
    isUpdating: boolean
}) {
    if (!step) return null

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] p-6 shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                        {step.title}
                                    </Dialog.Title>
                                    <button 
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <span className="sr-only">Close</span>
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                            {step.duration}
                                        </span>
                                        <span>•</span>
                                        <span className={step.completed ? "text-green-600" : "text-gray-500"}>
                                            {step.completed ? "Completed" : "Pending"}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-300">
                                        {step.description}
                                    </p>

                                    {/* Skills */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Skills to learn</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {step.skills.map((skill, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resources */}
                                    {step.resources && step.resources.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recommended Resources</h4>
                                            <ul className="space-y-2">
                                                {step.resources.map((res, i) => (
                                                    <li key={i}>
                                                        <a 
                                                            href={res.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                            {res.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <button
                                            onClick={() => onToggleComplete(step.id)}
                                            disabled={isUpdating}
                                            className={`w-full btn ${step.completed ? 'btn-outline' : 'btn-primary'} flex items-center justify-center gap-2`}
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : step.completed ? (
                                                <>
                                                    <Circle className="w-4 h-4" />
                                                    Mark as Incomplete
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Mark as Completed
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}

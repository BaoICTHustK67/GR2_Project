import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, Sparkles, Loader2 } from 'lucide-react'
import { roadmapApi, RoadmapTemplate, UserRoadmap } from '@/lib/roadmapApi'
import { RoadmapCard } from '@/components/roadmap/RoadmapCard'
import toast from 'react-hot-toast'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function Roadmaps() {
  const [activeTab, setActiveTab] = useState<'explore' | 'my'>('explore')
  const [templates, setTemplates] = useState<RoadmapTemplate[]>([])
  const [myRoadmaps, setMyRoadmaps] = useState<UserRoadmap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Roadmaps page mounted')
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [templatesRes, myRoadmapsRes] = await Promise.all([
        roadmapApi.getTemplates(),
        roadmapApi.getMyRoadmaps()
      ])
      
      if (templatesRes.data.success) {
        setTemplates(templatesRes.data.templates)
      }
      if (myRoadmapsRes.data.success) {
        setMyRoadmaps(myRoadmapsRes.data.roadmaps)
      }
    } catch (error) {
      console.error('Failed to fetch roadmaps:', error)
      toast.error('Failed to load roadmaps')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTemplate = async (templateId: number) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const response = await roadmapApi.saveRoadmap({
         templateId: template.id,
         title: `${template.role} Roadmap`,
         targetRole: template.role,
         targetLevel: template.level,
         steps: template.steps,
         isAiGenerated: false
      })

      if (response.data.success) {
        toast.success('Roadmap started successfully!')
        navigate(`/roadmaps/${response.data.roadmap.id}`)
      }
    } catch (error) {
      console.error('Failed to start roadmap:', error)
      toast.error('Failed to start roadmap')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600" />
            Career Roadmaps
          </h1>
          <p className="text-gray-500 mt-1">
            Discover your learning path or generate a personalized roadmap with AI.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-md hover:sahdow-lg transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('explore')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'explore'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Explore Templates
            {activeTab === 'explore' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'my'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Roadmaps
            <span className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs">
              {myRoadmaps.length}
            </span>
            {activeTab === 'my' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'explore' ? (
            templates.length > 0 ? (
              templates.map((template) => (
                <RoadmapCard 
                  key={template.id} 
                  template={template} 
                  onClick={() => handleStartTemplate(template.id)}
                />
              ))
            ) : (
               <div className="col-span-full text-center py-12 text-gray-500">
                 No templates found.
               </div>
            )
          ) : (
            myRoadmaps.length > 0 ? (
              myRoadmaps.map((roadmap) => (
                <RoadmapCard 
                  key={roadmap.id} 
                  roadmap={roadmap}
                  onClick={() => navigate(`/roadmaps/${roadmap.id}`)}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Map className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  No active roadmaps
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  You haven't started any learning paths yet. Explore templates or let AI generate a custom roadmap for you.
                </p>
                <div className="flex gap-3">
                   <button 
                     onClick={() => setActiveTab('explore')}
                     className="btn btn-primary"
                   >
                     Explore Templates
                   </button>
                   <button
                     onClick={() => setShowGenerateModal(true)}
                     className="btn btn-outline"
                   >
                     <Sparkles className="w-4 h-4 mr-2" />
                     Generate
                   </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Generate Modal */}
      <GenerateRoadmapModal 
        isOpen={showGenerateModal} 
        onClose={() => setShowGenerateModal(false)} 
        onSuccess={(id) => navigate(`/roadmaps/${id}`)}
      />
    </div>
  )
}

function GenerateRoadmapModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (id: number) => void }) {
  const [targetRole, setTargetRole] = useState('')
  const [targetLevel, setTargetLevel] = useState('Mid')
  const [additionalContext, setAdditionalContext] = useState('')
  const [useProfile, setUseProfile] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!targetRole) return
    setIsGenerating(true)
    try {
      // 1. Generate content (AI)
      const genRes = await roadmapApi.generateRoadmap({
        targetRole,
        targetLevel,
        useProfile,
        additionalContext
      })

      if (genRes.data.success) {
        // 2. Save it
        const roadmapData = genRes.data.roadmap
        const saveRes = await roadmapApi.saveRoadmap({
            title: roadmapData.title,
            targetRole,
            targetLevel,
            steps: roadmapData.steps,
            isAiGenerated: true
        })

        if (saveRes.data.success) {
            toast.success('Roadmap generated successfully!')
            onSuccess(saveRes.data.roadmap.id)
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate roadmap. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Generate Custom Roadmap
                </Dialog.Title>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Level
                    </label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                      className="input w-full"
                    >
                      <option>Intern</option>
                      <option>Junior</option>
                      <option>Mid</option>
                      <option>Senior</option>
                      <option>Lead/Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Context (Optional)
                    </label>
                    <textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="e.g. I want to focus on React and Node.js..."
                      className="input w-full h-20 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useProfile"
                      checked={useProfile}
                      onChange={(e) => setUseProfile(e.target.checked)}
                      className="checkbox checkbox-primary"
                    />
                    <label htmlFor="useProfile" className="text-sm text-gray-600 dark:text-gray-400">
                      Tailor based on my profile (skills, education)
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={onClose}
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none flex-1"
                    onClick={handleGenerate}
                    disabled={!targetRole || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Roadmap'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

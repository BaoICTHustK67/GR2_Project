import { useState } from 'react'
import { Sparkles, X, Save, RotateCcw, Loader2 } from 'lucide-react'
import { usersAPI } from '@/lib/api'

interface AIEnhancementDialogProps {
  section: 'headline' | 'about' | 'experience' | 'education' | 'project'
  currentContent: string
  onSave: (suggestedContent: string) => void
  onClose: () => void
}

export function AIEnhancementDialog({
  section,
  currentContent,
  onSave,
  onClose
}: AIEnhancementDialogProps) {
  const [suggestion, setSuggestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')
    try {
      const response = await usersAPI.enhanceProfile(section, currentContent)
      if (response.data.success) {
        setSuggestion(response.data.suggestion)
      } else {
        setError(response.data.message || 'Failed to generate suggestion')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while generating the suggestion')
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-generate on mount
  useState(() => {
    handleGenerate()
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#1A1C20] rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Suggestion
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isGenerating ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-gray-600 dark:text-gray-400">Drafting your enhancement...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={handleGenerate}
                className="btn btn-outline btn-sm gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  className="input w-full min-h-[150px] p-4 bg-gray-50 dark:bg-gray-900 border-purple-200 dark:border-purple-900 focus:border-purple-500 rounded-lg resize-none"
                  placeholder="AI suggestion will appear here..."
                />
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-4 h-4 text-purple-400 opacity-50" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onSave(suggestion)}
                  className="btn btn-primary flex-1 gap-2 bg-gradient-to-r from-purple-600 to-primary border-none text-white"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setSuggestion(currentContent)}
                  className="btn btn-ghost flex-1 gap-2 border border-gray-200 dark:border-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revert
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-ghost"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

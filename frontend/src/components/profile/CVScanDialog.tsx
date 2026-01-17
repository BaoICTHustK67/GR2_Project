import { useState, useRef, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { usersAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface CVScanDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialResults?: any
}

export function CVScanDialog({ isOpen, onClose, onSuccess, initialResults }: CVScanDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(initialResults || null)
  const [isApplying, setIsApplying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state with prop when it changes
  useEffect(() => {
    if (initialResults) {
      setScanResult(initialResults)
    }
  }, [initialResults])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleScan = async () => {
    if (!file) return

    setIsScanning(true)
    try {
      const response = await usersAPI.scanCV(file)
      if (response.data.success) {
        setScanResult(response.data.data)
        toast.success('CV scanned successfully!')
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      toast.error(error.response?.data?.message || 'Failed to scan CV')
    } finally {
      setIsScanning(false)
    }
  }

  const handleApply = async () => {
    if (!scanResult) return

    setIsApplying(true)
    try {
      const response = await usersAPI.bulkUpdateProfile(scanResult)
      if (response.data.success) {
        toast.success('Profile updated successfully!')
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsApplying(false)
    }
  }

  const reset = () => {
    setFile(null)
    setScanResult(null)
    setIsScanning(false)
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {scanResult ? 'Review Extracted Data' : 'Scan CV to Auto-fill Profile'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!scanResult ? (
                  <div className="space-y-6">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {file ? file.name : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            PDF, DOCX, or TXT (max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={onClose}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleScan}
                        disabled={!file || isScanning}
                        className="btn btn-primary"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Scanning...
                          </>
                        ) : (
                          'Scan CV'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-purple-900 dark:text-purple-100">
                            Analysis Complete
                          </h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            We've extracted the following information from your CV. Please review before applying to your profile.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                       {/* Basic Info */}
                       <div>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-900 py-2">Profile Basics</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <span className="block text-xs text-gray-500">Name</span>
                                <span className="font-medium">{scanResult.user?.name || '-'}</span>
                             </div>
                             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <span className="block text-xs text-gray-500">Headline</span>
                                <span className="font-medium">{scanResult.user?.headline || '-'}</span>
                             </div>
                             <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded sm:col-span-2">
                                <span className="block text-xs text-gray-500">Bio</span>
                                <span className="font-medium">{scanResult.user?.bio || '-'}</span>
                             </div>
                          </div>
                       </div>

                       {/* Experience */}
                       <div>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-900 py-2">Experience ({scanResult.experience?.length || 0})</h4>
                          <div className="space-y-3">
                             {scanResult.experience?.map((exp: any, i: number) => (
                                <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                                   <div className="font-semibold">{exp.title}</div>
                                   <div className="text-gray-600 dark:text-gray-400">{exp.company}</div>
                                   <div className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Education */}
                       <div>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-900 py-2">Education ({scanResult.education?.length || 0})</h4>
                          <div className="space-y-3">
                             {scanResult.education?.map((edu: any, i: number) => (
                                <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                                   <div className="font-semibold">{edu.school}</div>
                                   <div className="text-gray-600 dark:text-gray-400">{edu.degree}</div>
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       {/* Skills */}
                       <div>
                          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-900 py-2">Skills ({scanResult.skills?.length || 0})</h4>
                          <div className="flex flex-wrap gap-2">
                             {scanResult.skills?.map((skill: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium border border-gray-200 dark:border-gray-700">
                                   {skill.name} ({skill.level})
                                </span>
                             ))}
                          </div>
                       </div>

                       {/* Recommendations */}
                       {scanResult.recommendations?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-900 py-2">
                               <AlertCircle className="w-4 h-4 text-yellow-500" />
                               AI Recommendations
                            </h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                               {scanResult.recommendations.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                               ))}
                            </ul>
                          </div>
                       )}
                    </div>

                    <div className="flex justify-between md:justify-end gap-3 pt-4 border-t dark:border-gray-800">
                      <button
                        onClick={reset}
                        className="btn btn-ghost text-sm"
                      >
                        Scan Different File
                      </button>
                      <div className="flex gap-3">
                         <button
                           onClick={onClose}
                           className="btn btn-outline"
                         >
                           Cancel
                         </button>
                         <button
                           onClick={handleApply}
                           disabled={isApplying}
                           className="btn btn-primary"
                         >
                           {isApplying ? (
                             <>
                               <Loader2 className="w-4 h-4 animate-spin mr-2" />
                               Applying...
                             </>
                           ) : (
                             'Apply to Profile'
                           )}
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

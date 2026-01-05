import { useState, useRef } from 'react'
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react'
import { usersAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface CVUploadCardProps {
  onScanComplete: (data: any) => void
}

export function CVUploadCard({ onScanComplete }: CVUploadCardProps) {
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    setIsScanning(true)
    try {
      const response = await usersAPI.scanCV(file)
      if (response.data.success) {
        toast.success('CV scanned successfully!')
        onScanComplete(response.data.data)
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      toast.error(error.response?.data?.message || 'Failed to scan CV')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-900/30">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Auto-fill Profile from CV
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Upload your resume (PDF, DOCX) to automatically populate your experience, education, and skills.
      </p>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
          ${isScanning 
            ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 opacity-70 cursor-wait' 
            : 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-white/50 dark:hover:bg-white/5'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={isScanning}
        />
        
        <div className="flex flex-col items-center gap-3">
          {isScanning ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Analyzing your CV with AI...
              </p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF or DOCX (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

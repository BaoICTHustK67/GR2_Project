import { useState } from 'react'

type Props = {
  onSend: (content: string) => void
  disabled?: boolean
}

export default function MessageComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const send = () => {
    const v = value.trim()
    if (!v) return
    onSend(value)
    setValue('')
  }

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-800">
      <div className="flex gap-2 items-end">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={1}
          placeholder="Write a message..."
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={disabled}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-500">Enter to send • Shift+Enter for new line</div>
    </div>
  )
}

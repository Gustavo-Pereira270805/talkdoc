import { useState, type KeyboardEvent } from 'react'

export default function ChatInput({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (question: string) => void
}) {
  const [value, setValue] = useState('')

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit(value.trim())
        setValue('')
      }
    }
  }

  return (
    <div className="hard-shadow flex items-end gap-3 border-2 border-edge bg-panel p-3">
      <label htmlFor="chat-input" className="sr-only">
        Sua pergunta
      </label>
      <textarea
        id="chat-input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="> digite sua pergunta…"
        className="flex-1 resize-none border-2 border-edge bg-ink px-3 py-2 text-sm text-term placeholder:text-fog disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => {
          if (!disabled && value.trim()) {
            onSubmit(value.trim())
            setValue('')
          }
        }}
        disabled={disabled || !value.trim()}
        className="hard-shadow-sm border-2 border-black bg-term px-4 py-2 font-display text-xl text-ink transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:bg-edge disabled:text-fog"
      >
        ENVIAR ▸
      </button>
    </div>
  )
}
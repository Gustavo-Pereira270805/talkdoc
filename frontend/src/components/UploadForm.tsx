import { useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError, uploadDocument } from '../api/documents'

export const MAX_FILE_SIZE = 20 * 1024 * 1024

export default function UploadForm() {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function validate(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'O arquivo precisa ser um PDF.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'O arquivo deve ter no máximo 20 MB.'
    }
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('Escolha um arquivo PDF.')
      return
    }
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)
    try {
      await uploadDocument(file)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o arquivo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hard-shadow flex flex-col gap-4 border-2 border-edge bg-panel p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="mb-1.5 flex items-baseline gap-1 text-sm font-semibold text-term">
            <span aria-hidden="true">&gt;</span>
            <label htmlFor="document-input">Documento (PDF)</label>
          </div>
          <input
            id="document-input"
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer border-2 border-edge bg-ink px-3 py-2.5 text-sm text-term file:mr-3 file:cursor-pointer file:border-2 file:border-black file:bg-term file:px-3 file:py-1.5 file:font-semibold file:text-ink hover:file:bg-cyanx"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="hard-shadow-sm border-2 border-black bg-term px-5 py-2.5 font-display text-xl font-semibold text-ink transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:bg-edge disabled:text-fog"
        >
          {uploading ? 'ENVIANDO…' : 'ENVIAR ▸'}
        </button>
      </div>
      {error && (
        <p role="alert" className="border-2 border-black bg-alarm px-3 py-2 text-sm font-semibold text-ink">
          ✕ {error}
        </p>
      )}
    </form>
  )
}
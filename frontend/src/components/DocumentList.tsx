import type { Document } from '../api/documents'
import { useDocument, useDocuments } from '../hooks/useDocuments'
import { StatusBadge } from './StatusBadge'
import { formatError } from './formatError'
import { PROCESSING_STATUSES } from '../hooks/useDocuments'

function DocumentCard({ document }: { document: Document }) {
  const { data: detail } = useDocument(document.id)
  const status = detail?.status ?? document.status
  const error = detail?.error ?? null
  const pageCount = detail?.page_count ?? null
  const processing = PROCESSING_STATUSES.has(status)

  return (
    <li className="hard-shadow flex flex-col gap-2 border-2 border-edge bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-mono font-semibold text-term" title={document.filename}>
          {document.filename}
        </p>
        <p className="mt-0.5 text-xs text-fog">
          {pageCount !== null && pageCount > 0
            ? `${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}`
            : processing
              ? 'processando…'
              : 'aguardando processamento'}
        </p>
        {error && (
          <p
            role="alert"
            className="mt-1.5 inline-block max-w-full border-2 border-black bg-alarm px-2 py-0.5 text-xs font-semibold text-ink"
            title={error}
          >
            ✕ {formatError(error)}
          </p>
        )}
      </div>
      <StatusBadge status={status} />
    </li>
  )
}

export default function DocumentList() {
  const { data: documents, isLoading, isError } = useDocuments()

  if (isLoading) {
    return <p className="text-sm text-fog blink">carregando documentos…</p>
  }
  if (isError) {
    return (
      <p role="alert" className="inline-block border-2 border-black bg-alarm px-3 py-2 text-sm font-semibold text-ink">
        ✕ Não foi possível carregar a lista de documentos.
      </p>
    )
  }
  if (!documents?.length) {
    return <p className="text-sm text-fog">nenhum documento ainda — envie seu primeiro PDF</p>
  }

  return (
    <ul className="flex flex-col gap-4">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </ul>
  )
}
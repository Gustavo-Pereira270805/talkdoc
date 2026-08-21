import type { DocumentStatus } from '../api/documents'

const LABELS: Record<DocumentStatus, string> = {
  queued: 'Na fila',
  extracting: 'Extraindo',
  indexing: 'Indexando',
  ready: 'Pronto',
  failed: 'Falhou',
}

const STYLES: Record<DocumentStatus, string> = {
  queued: 'bg-amber text-ink',
  extracting: 'bg-cyanx text-ink blink',
  indexing: 'bg-cyanx text-ink blink',
  ready: 'bg-term text-ink',
  failed: 'bg-alarm text-ink',
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      role="status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 border-2 border-black px-2.5 py-0.5 font-display text-lg leading-none tracking-wide ${STYLES[status] ?? STYLES.queued}`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
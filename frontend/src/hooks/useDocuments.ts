import { useQuery } from '@tanstack/react-query'
import { getDocument, listDocuments, type DocumentStatus } from '../api/documents'

export const POLL_OPTIONS = { intervalMs: 2000 }

export const PROCESSING_STATUSES = new Set<DocumentStatus>(['queued', 'extracting', 'indexing'])

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: listDocuments })
}

export function useDocument(id: number) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocument(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && PROCESSING_STATUSES.has(status) ? POLL_OPTIONS.intervalMs : false
    },
  })
}

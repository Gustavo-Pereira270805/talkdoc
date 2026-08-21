export type DocumentStatus = 'queued' | 'extracting' | 'indexing' | 'ready' | 'failed'

export interface Document {
  id: number
  filename: string
  status: DocumentStatus
}

export interface DocumentDetail extends Document {
  page_count: number | null
  error: string | null
}

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    let message = 'Erro inesperado. Tente novamente.'
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // corpo não-JSON: mantém a mensagem padrão
    }
    throw new ApiError(message)
  }
  return response.json() as Promise<T>
}

export function uploadDocument(file: File): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  return request<Document>('/documents', { method: 'POST', body: form })
}

export function getDocument(id: number): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${id}`)
}

export function listDocuments(): Promise<Document[]> {
  return request<Document[]>('/documents')
}

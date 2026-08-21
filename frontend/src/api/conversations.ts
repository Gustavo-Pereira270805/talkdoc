import { ApiError } from './documents'

export interface Conversation {
  id: number
  title: string
  created_at: string
}

export interface Reference {
  label: string
  text: string
  page: number
  document_id: number
  filename: string
}

export interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  refs: Reference[] | null
  created_at: string
}

export type ChatEventKind = 'references' | 'token' | 'done' | 'error'

export interface ChatEvent {
  kind: ChatEventKind
  data: Record<string, unknown>
}

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

export function createConversation(documentIds: number[], title?: string): Promise<Conversation> {
  return request<Conversation>('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_ids: documentIds, title }),
  })
}

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations')
}

export function listMessages(conversationId: number): Promise<Message[]> {
  return request<Message[]>(`/conversations/${conversationId}/messages`)
}

export function createSSEParser(onEvent: (event: ChatEvent) => void): (chunk: string) => void {
  let buffer = ''
  return function push(chunk: string): void {
    buffer += chunk.replace(/\r\n/g, '\n')
    let boundary: number
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const event = parseEventBlock(block)
      if (event) onEvent(event)
    }
  }
}

function parseEventBlock(block: string): ChatEvent | null {
  let kind: ChatEventKind | null = null
  const dataLines: string[] = []
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      kind = line.slice(6).trim() as ChatEventKind
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
    // comentários (": ping") e linhas vazias são ignorados
  }
  if (kind === null || !dataLines.length) return null
  const data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
  return { kind, data }
}

export async function chatStream(
  conversationId: number,
  question: string,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  })
  if (!response.ok || !response.body) {
    let message = 'Erro inesperado. Tente novamente.'
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) message = body.detail
    } catch {
      // corpo não-JSON: mantém a mensagem padrão
    }
    throw new ApiError(message)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const push = createSSEParser(onEvent)
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      push(decoder.decode(value, { stream: true }))
    }
  } finally {
    reader.releaseLock()
  }
}

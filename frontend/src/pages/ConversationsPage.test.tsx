import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ConversationsPage from './ConversationsPage'
import * as api from '../api/conversations'
import * as docApi from '../api/documents'

vi.mock('../api/conversations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/conversations')>()
  return {
    ...actual,
    createConversation: vi.fn(),
    listConversations: vi.fn(),
  }
})

vi.mock('../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/documents')>()
  return { ...actual, listDocuments: vi.fn() }
})

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateMock }
})

const mockedApi = vi.mocked(api, true)
const mockedDocApi = vi.mocked(docApi, true)

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConversationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ConversationsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    navigateMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lista conversas com títulos', async () => {
    mockedApi.listConversations.mockResolvedValue([
      { id: 1, title: 'contrato.pdf', created_at: '2026-08-20T10:00:00' },
      { id: 2, title: 'relatorio.pdf', created_at: '2026-08-20T11:00:00' },
    ])
    renderPage()

    expect(await screen.findByText('contrato.pdf')).toBeInTheDocument()
    expect(screen.getByText('relatorio.pdf')).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há conversas', async () => {
    mockedApi.listConversations.mockResolvedValue([])
    renderPage()
    await waitFor(() => expect(screen.getByText(/nenhuma conversa/i)).toBeInTheDocument())
  })

  it('mostra erro de carregamento inline', async () => {
    mockedApi.listConversations.mockRejectedValue(new Error('Falha ao carregar.'))
    renderPage()
    expect(await screen.findByText(/falha ao carregar/i)).toBeInTheDocument()
  })

  it('cria conversa selecionando documentos e navega para o chat', async () => {
    mockedApi.listConversations.mockResolvedValue([])
    mockedDocApi.listDocuments.mockResolvedValue([
      { id: 1, filename: 'a.pdf', status: 'ready' },
      { id: 2, filename: 'b.pdf', status: 'ready' },
    ])
    mockedApi.createConversation.mockResolvedValue({ id: 3, title: 'b.pdf', created_at: '2026-08-20T12:00:00' })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /nova conversa/i }))
    expect(await screen.findByText('a.pdf')).toBeInTheDocument()

    await user.click(screen.getByLabelText('b.pdf'))
    await user.click(screen.getByRole('button', { name: /criar/i }))

    await waitFor(() => expect(mockedApi.createConversation).toHaveBeenCalledWith([2]))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/conversas/3'))
  })

  it('bloqueia criar conversa sem documentos selecionados', async () => {
    mockedApi.listConversations.mockResolvedValue([])
    mockedDocApi.listDocuments.mockResolvedValue([{ id: 1, filename: 'a.pdf', status: 'ready' }])
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /nova conversa/i }))
    await user.click(await screen.findByRole('button', { name: /criar/i }))

    expect(mockedApi.createConversation).not.toHaveBeenCalled()
    expect(await screen.findByText(/selecione ao menos um documento/i)).toBeInTheDocument()
  })
})
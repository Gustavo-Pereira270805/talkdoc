import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ChatPage from './ChatPage'
import * as api from '../api/conversations'

vi.mock('../api/conversations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/conversations')>()
  return {
    ...actual,
    listConversations: vi.fn(),
    listMessages: vi.fn(),
    chatStream: vi.fn(),
  }
})

const mockedApi = vi.mocked(api, true)

const REFS = [
  {
    label: 'S1',
    text: 'O TalkDoc extrai texto de PDFs e indexa em banco vetorial.',
    page: 1,
    document_id: 9,
    filename: 'talkdoc.pdf',
  },
]

function historyMessage(overrides: Partial<api.Message>): api.Message {
  return {
    id: 1,
    role: 'user',
    content: 'Qual modelo o TalkDoc usa?',
    refs: null,
    created_at: '2026-08-20T10:00:00',
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/conversas/1']}>
        <Routes>
          <Route path="/conversas/:id" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ChatPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedApi.listConversations.mockResolvedValue([
      { id: 1, title: 'talkdoc.pdf', created_at: '2026-08-20T09:00:00' },
    ])
  })

  it('carrega o histórico da API e renderiza refs em cards', async () => {
    mockedApi.listMessages.mockResolvedValue([
      historyMessage({ role: 'assistant', content: 'O modelo é Llama 3.3 70B [S1].', refs: REFS }),
    ])
    renderPage()

    expect(await screen.findByText('O modelo é Llama 3.3 70B [S1].')).toBeInTheDocument()
    expect(await screen.findByText('S1 · talkdoc.pdf · pág. 1')).toBeInTheDocument()
  })

  it('envia pergunta e renderiza tokens progressivamente com cards de refs', async () => {
    mockedApi.listMessages.mockResolvedValueOnce([])
    mockedApi.listMessages.mockResolvedValue([
      historyMessage({ content: 'Como o TalkDoc responde?', role: 'user' }),
      historyMessage({ id: 2, role: 'assistant', content: 'O TalkDoc responde [S1].', refs: REFS }),
    ])
    mockedApi.chatStream.mockImplementation(async (_id, _question, onEvent) => {
      onEvent({ kind: 'token', data: { token: 'O ' } })
      await new Promise((resolve) => setTimeout(resolve, 5))
      onEvent({ kind: 'token', data: { token: 'TalkDoc ' } })
      await new Promise((resolve) => setTimeout(resolve, 5))
      onEvent({ kind: 'token', data: { token: 'responde [S1].' } })
      onEvent({ kind: 'references', data: { references: REFS } })
      onEvent({ kind: 'done', data: {} })
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Sua pergunta'), 'Como o TalkDoc responde?{Enter}')

    await waitFor(() => expect(screen.getByText('Como o TalkDoc responde?')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('O TalkDoc responde [S1].')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('S1 · talkdoc.pdf · pág. 1')).toBeInTheDocument())
    expect(mockedApi.chatStream).toHaveBeenCalledWith(
      1,
      'Como o TalkDoc responde?',
      expect.any(Function),
    )
  })

  it('mostra o rótulo "transmitindo" enquanto o stream está ativo e some ao finalizar', async () => {
    mockedApi.listMessages.mockResolvedValue([])
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    mockedApi.chatStream.mockImplementation(async (_id, _question, onEvent) => {
      onEvent({ kind: 'token', data: { token: 'parcial' } })
      await gate
      onEvent({ kind: 'done', data: {} })
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Sua pergunta'), 'Teste{Enter}')

    await waitFor(() => expect(screen.getByText(/transmitindo/)).toBeInTheDocument())
    expect(screen.getByText('parcial')).toBeInTheDocument()

    release()
    await waitFor(() => expect(screen.queryByText(/transmitindo/)).not.toBeInTheDocument())
  })

  it('mostra erro do stream inline no balão', async () => {
    mockedApi.listMessages.mockResolvedValue([])
    mockedApi.chatStream.mockImplementation(async (_id, _question, onEvent) => {
      onEvent({ kind: 'error', data: { message: 'Provedor indisponível.' } })
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Sua pergunta'), 'Teste{Enter}')

    expect(await screen.findByText(/provedor indisponível/i)).toBeInTheDocument()
  })

  it('desabilita o input enquanto o stream está em andamento', async () => {
    mockedApi.listMessages.mockResolvedValue([])
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    mockedApi.chatStream.mockImplementation(async (_id, _question, onEvent) => {
      onEvent({ kind: 'token', data: { token: 'parcial' } })
      await gate
      onEvent({ kind: 'done', data: {} })
    })
    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByLabelText('Sua pergunta')
    await user.type(input, 'Teste{Enter}')

    await waitFor(() => expect(input).toBeDisabled())

    release()
    await waitFor(() => expect(input).toBeEnabled())
  })
})

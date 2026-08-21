import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UploadPage from './UploadPage'
import * as api from '../api/documents'
import { POLL_OPTIONS } from '../hooks/useDocuments'

vi.mock('../api/documents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/documents')>()
  return {
    ...actual,
    uploadDocument: vi.fn(),
    getDocument: vi.fn(),
    listDocuments: vi.fn(),
  }
})

const mockedApi = vi.mocked(api, true)

const MAX = 20 * 1024 * 1024

function makeFile(name: string, size = 1024, type = 'application/pdf') {
  return new File([new Uint8Array(size)], name, { type })
}

const listOf = (docs: unknown[]) => mockedApi.listDocuments.mockResolvedValue(docs as never)

function detailOf(overrides: Partial<api.DocumentDetail>) {
  return { id: 1, filename: 'contrato.pdf', status: 'ready', page_count: 1, error: null, ...overrides } as api.DocumentDetail
}

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => {
    release = resolve
  })
  return { promise, release }
}

function pickFile(file: File) {
  fireEvent.change(screen.getByLabelText('Documento (PDF)'), { target: { files: [file] } })
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <UploadPage />
    </QueryClientProvider>,
  )
}

describe('UploadPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    POLL_OPTIONS.intervalMs = 200
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o formulário de upload e estado vazio', async () => {
    listOf([])
    renderPage()

    expect(screen.getByLabelText('Documento (PDF)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/nenhum documento ainda/i)).toBeInTheDocument())
  })

  it('rejeita arquivo que não é PDF com mensagem clara', async () => {
    listOf([])
    const user = userEvent.setup()
    renderPage()

    pickFile(makeFile('nota.txt', 100, 'text/plain'))
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/precisa ser um pdf/i)).toBeInTheDocument()
    expect(mockedApi.uploadDocument).not.toHaveBeenCalled()
  })

  it('rejeita arquivo maior que 20 MB com mensagem clara', async () => {
    listOf([])
    const user = userEvent.setup()
    renderPage()

    pickFile(makeFile('grande.pdf', MAX + 1))
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/máximo 20 MB/i)).toBeInTheDocument()
    expect(mockedApi.uploadDocument).not.toHaveBeenCalled()
  })

  it('mostra erro do servidor inline quando o upload falha', async () => {
    listOf([])
    mockedApi.uploadDocument.mockRejectedValue(new api.ApiError('Só aceitamos PDFs válidos.'))
    const user = userEvent.setup()
    renderPage()

    pickFile(makeFile('falso.pdf'))
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText(/Só aceitamos PDFs válidos/)).toBeInTheDocument()
  })

  it('upload válido mostra o card processando e depois "Pronto" via polling', async () => {
    mockedApi.listDocuments.mockResolvedValueOnce([])
    mockedApi.listDocuments.mockResolvedValueOnce([{ id: 1, filename: 'contrato.pdf', status: 'queued' } as api.Document])
    mockedApi.uploadDocument.mockResolvedValue({ id: 1, filename: 'contrato.pdf', status: 'queued' } as api.Document)
    const extracting = gate()
    mockedApi.getDocument
      .mockResolvedValueOnce(detailOf({ status: 'queued' }))
      .mockImplementationOnce(() => extracting.promise.then(() => detailOf({ status: 'extracting' })))
      .mockResolvedValueOnce(detailOf({ status: 'ready', page_count: 3 }))
    const user = userEvent.setup()
    renderPage()

    pickFile(makeFile('contrato.pdf'))
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText('contrato.pdf')).toBeInTheDocument()
    expect(await screen.findByText('Na fila')).toBeInTheDocument()
    expect(mockedApi.listDocuments).toHaveBeenCalled()

    extracting.release()
    expect(await screen.findByText('Extraindo')).toBeInTheDocument()

    expect(await screen.findByText('Pronto')).toBeInTheDocument()
    expect(await screen.findByText(/3 páginas/i)).toBeInTheDocument()
  })

  it('falha de processamento aparece no card do documento', async () => {
    mockedApi.listDocuments.mockResolvedValueOnce([])
    mockedApi.listDocuments.mockResolvedValueOnce([{ id: 1, filename: 'scan.pdf', status: 'queued' } as api.Document])
    mockedApi.uploadDocument.mockResolvedValue({ id: 1, filename: 'scan.pdf', status: 'queued' } as api.Document)
    const failed = gate()
    mockedApi.getDocument
      .mockResolvedValueOnce(detailOf({ filename: 'scan.pdf', status: 'indexing' }))
      .mockImplementationOnce(() =>
        failed.promise.then(() => detailOf({ filename: 'scan.pdf', status: 'failed', error: 'PDF escaneado sem texto extraível.' })),
      )
    const user = userEvent.setup()
    renderPage()

    pickFile(makeFile('scan.pdf'))
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    expect(await screen.findByText('Indexando')).toBeInTheDocument()

    failed.release()
    expect(await screen.findByText('Falhou')).toBeInTheDocument()
    expect(await screen.findByText(/PDF escaneado sem texto extraível/i)).toBeInTheDocument()
  })

  it('lista documentos existentes com badges de status', async () => {
    listOf([
      { id: 1, filename: 'relatorio.pdf', status: 'ready' },
      { id: 2, filename: 'scan.pdf', status: 'failed' },
      { id: 3, filename: 'novo.pdf', status: 'extracting' },
    ])
    mockedApi.getDocument
      .mockResolvedValueOnce(detailOf({ filename: 'relatorio.pdf', status: 'ready', page_count: 5 }))
      .mockResolvedValueOnce(detailOf({ filename: 'scan.pdf', status: 'failed', error: 'PDF escaneado sem texto extraível.' }))
      .mockResolvedValueOnce(detailOf({ filename: 'novo.pdf', status: 'extracting' }))
    renderPage()

    expect(await screen.findByText('relatorio.pdf')).toBeInTheDocument()
    expect(await screen.findByText('Pronto')).toBeInTheDocument()
    expect(await screen.findByText(/5 páginas/i)).toBeInTheDocument()
    expect(await screen.findByText('scan.pdf')).toBeInTheDocument()
    expect(await screen.findByText('Falhou')).toBeInTheDocument()
    expect(await screen.findByText(/PDF escaneado sem texto extraível/i)).toBeInTheDocument()
    expect(await screen.findByText('novo.pdf')).toBeInTheDocument()
    expect(await screen.findByText('Extraindo')).toBeInTheDocument()
  })
})
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('começa fechada: só o widget retrátil visível, com label acessível', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /abrir navegação/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /documentos/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /conversas/i })).not.toBeInTheDocument()
  })

  it('esconde o widget enquanto a barra está aberta e o retoma ao fechar', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /abrir navegação/i }))
    expect(screen.queryByRole('button', { name: /abrir navegação/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar navegação' }))
    expect(screen.getByRole('button', { name: /abrir navegação/i })).toBeInTheDocument()
  })

  it('abre a barra ao clicar no widget, com os botões explícitos', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /abrir navegação/i }))
    expect(screen.getByRole('link', { name: /documentos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conversas/i })).toBeInTheDocument()
  })

  it('fecha ao clicar no ✕', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /abrir navegação/i }))
    await user.click(screen.getByRole('button', { name: 'Fechar navegação' }))
    expect(screen.queryByRole('link', { name: /conversas/i })).not.toBeInTheDocument()
  })

  it('fecha ao clicar no fundo escurecido', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.click(screen.getByRole('button', { name: /abrir navegação/i }))
    await user.click(screen.getByLabelText('Fechar navegação clicando fora'))
    expect(screen.queryByRole('link', { name: /conversas/i })).not.toBeInTheDocument()
  })

  it('marca a página atual com aria-current e navega pelo link', async () => {
    const user = userEvent.setup()
    renderSidebar('/conversas')
    await user.click(screen.getByRole('button', { name: /abrir navegação/i }))
    const conversas = screen.getByRole('link', { name: /conversas/i })
    expect(conversas).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /documentos/i })).not.toHaveAttribute('aria-current')
  })
})

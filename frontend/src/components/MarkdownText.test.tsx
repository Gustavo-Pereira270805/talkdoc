import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownText from './MarkdownText'

describe('MarkdownText', () => {
  it('renderiza **negrito** sem asteriscos', () => {
    render(<MarkdownText text="Isso é **muito** importante." />)
    expect(screen.getByText('Isso é ', { exact: false }).textContent).toContain('muito')
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })

  it('renderiza *itálico* sem asteriscos', () => {
    render(<MarkdownText text="O gato *andava* devagar." />)
    expect(screen.queryByText(/\*/)).not.toBeInTheDocument()
  })

  it('renderiza `código` em destaque', () => {
    render(<MarkdownText text="Use `docker compose up` para subir." />)
    expect(screen.queryByText(/`/)).not.toBeInTheDocument()
  })

  it('converte títulos ## sem o # visível', () => {
    render(<MarkdownText text={'## Como funciona\nO texto abaixo.'} />)
    expect(screen.getByText('Como funciona')).toBeInTheDocument()
    expect(screen.queryByText(/#/)).not.toBeInTheDocument()
  })

  it('converte listas - item sem o hífen cru', () => {
    render(<MarkdownText text={'- Primeiro item\n- Segundo item'} />)
    expect(screen.getByText('Primeiro item')).toBeInTheDocument()
    expect(screen.getByText('Segundo item')).toBeInTheDocument()
    expect(screen.queryByText(/^- /)).not.toBeInTheDocument()
  })

  it('preserva texto simples e quebras de linha', () => {
    render(<MarkdownText text={'Linha um\nLinha dois'} />)
    expect(screen.getByText('Linha um')).toBeInTheDocument()
    expect(screen.getByText('Linha dois')).toBeInTheDocument()
  })

  it('deixa marcação desconhecida como texto', () => {
    render(<MarkdownText text="A resposta ~~não~~ está aqui." />)
    expect(screen.getByText(/~~não~~/)).toBeInTheDocument()
  })
})

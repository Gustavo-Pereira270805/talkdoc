import { describe, expect, it } from 'vitest'
import { createSSEParser, type ChatEvent } from './conversations'

function collect() {
  const events: ChatEvent[] = []
  const push = createSSEParser((event) => events.push(event))
  return { events, push }
}

describe('createSSEParser', () => {
  it('emite eventos na ordem correta mesmo com chunks cortados no meio do evento', () => {
    const { events, push } = collect()

    push(
      'event: references\ndata: {"references": [{"label":"S1","text":"trecho","page":1,"document_id":2,"filename":"a.pdf"}]}\n\n',
    )
    push('event: to')
    push('ken\ndata: {"token":"Olá"}\n\nevent: do')
    push('ne\ndata: {}\n\n')

    expect(events.map((event) => event.kind)).toEqual(['references', 'token', 'done'])
    expect(events[0].data).toEqual({
      references: [{ label: 'S1', text: 'trecho', page: 1, document_id: 2, filename: 'a.pdf' }],
    })
    expect(events[1].data).toEqual({ token: 'Olá' })
  })

  it('converte evento error com mensagem', () => {
    const { events, push } = collect()
    push('event: error\ndata: {"message":"Provedor indisponível."}\n\n')
    expect(events).toEqual([{ kind: 'error', data: { message: 'Provedor indisponível.' } }])
  })

  it('concatena data de múltiplas linhas (spec SSE)', () => {
    const { events, push } = collect()
    push('event: token\ndata: {"token":"linha1"\ndata: }\n\n')
    expect(events[0].data).toEqual({ token: 'linha1' })
  })

  it('ignora comentários keep-alive (: ping)', () => {
    const { events, push } = collect()
    push(': ping\n\nevent: done\ndata: {}\n\n')
    expect(events.map((event) => event.kind)).toEqual(['done'])
  })

  it('funciona com separadores CRLF', () => {
    const { events, push } = collect()
    push('event: done\r\ndata: {}\r\n\r\n')
    expect(events).toEqual([{ kind: 'done', data: {} }])
  })
})

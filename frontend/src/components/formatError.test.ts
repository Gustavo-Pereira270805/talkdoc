import { describe, expect, it } from 'vitest'
import { formatError } from '../components/formatError'

describe('formatError', () => {
  it('mascara parâmetros key= em URLs de erro', () => {
    const url = 'https://api.example.com/embed?key=AQ.Secret1234567890&model=x'
    expect(formatError(`Falha: ${url}`)).toContain('key=***')
    expect(formatError(`Falha: ${url}`)).not.toContain('Secret1234567890')
  })

  it('trunca mensagens longas em até 2 linhas legíveis', () => {
    const long = 'x'.repeat(300)
    const result = formatError(long)
    expect(result.length).toBeLessThanOrEqual(140)
    expect(result.endsWith('…')).toBe(true)
  })

  it('preserva mensagens curtas e limpas', () => {
    expect(formatError('PDF escaneado sem texto extraível.')).toBe(
      'PDF escaneado sem texto extraível.',
    )
  })
})

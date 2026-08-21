const MAX_ERROR_LENGTH = 140

export function formatError(message: string): string {
  const masked = message.replace(/([?&](?:key|api[_-]?key|apikey|token)=)[^&\s]+/gi, '$1***')
  if (masked.length <= MAX_ERROR_LENGTH) return masked
  return `${masked.slice(0, MAX_ERROR_LENGTH - 1)}…`
}

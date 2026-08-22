import type { Message, Reference } from '../api/conversations'
import { formatError } from './formatError'
import MarkdownText from './MarkdownText'
import RefCard from './RefCard'

export function AssistantMessage({ content, refs }: { content: string; refs: Reference[] | null }) {
  return (
    <div className="flex flex-col gap-2">
      <MarkdownText text={content} />
      {refs?.length ? (
        <div className="flex flex-col gap-1.5">
          {refs.map((reference) => (
            <RefCard key={reference.label} label={reference.label} reference={reference} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function ChatMessage({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap border-2 border-black bg-term px-3 py-2 font-semibold leading-relaxed text-ink">
          {message.content}
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <AssistantMessage content={message.content} refs={message.refs} />
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex justify-start">
      <p
        role="alert"
        className="max-w-[85%] border-2 border-black bg-alarm px-3 py-2 text-sm font-semibold leading-relaxed text-ink"
      >
        ✕ {formatError(message)}
      </p>
    </div>
  )
}

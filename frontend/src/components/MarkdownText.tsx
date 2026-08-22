import { Fragment, type ReactNode } from 'react'

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyBase}-${index}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-term">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="text-term">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="bg-ink px-1 text-cyanx">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

export default function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="leading-relaxed text-term">
      {lines.map((line, lineIndex) => {
        const heading = line.match(/^(#{1,4})\s+(.+)$/)
        if (heading) {
          return (
            <p key={lineIndex} className="mt-2 font-display text-2xl leading-none text-cyanx">
              {renderInline(heading[2], `h-${lineIndex}`)}
            </p>
          )
        }
        const item = line.match(/^[-*]\s+(.+)$/)
        if (item) {
          return (
            <p key={lineIndex} className="flex gap-2">
              <span aria-hidden="true">▸</span>
              <span>{renderInline(item[1], `li-${lineIndex}`)}</span>
            </p>
          )
        }
        if (/^\s*---+$/.test(line)) {
          return <hr key={lineIndex} className="my-2 border-t-2 border-edge" />
        }
        if (line.trim() === '') {
          return <p key={lineIndex}>&nbsp;</p>
        }
        return <p key={lineIndex}>{renderInline(line, `p-${lineIndex}`)}</p>
      })}
    </div>
  )
}

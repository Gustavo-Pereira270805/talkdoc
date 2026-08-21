import { useState } from 'react'
import type { Reference } from '../api/conversations'

export default function RefCard({ label, reference }: { label: string; reference: Reference }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      aria-expanded={expanded}
      className="hard-shadow-sm block w-full border-2 border-black bg-amber px-3 py-1.5 text-left"
    >
      <span className="font-display text-lg leading-none text-ink">
        {label} · {reference.filename} · pág. {reference.page}
      </span>
      {expanded && (
        <span className="mt-1.5 block border-t-2 border-ink/30 pt-1.5 text-sm leading-relaxed text-ink">
          {reference.text}
        </span>
      )}
    </button>
  )
}

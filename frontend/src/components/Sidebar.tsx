import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const atConversas = location.pathname.startsWith('/conversas')

  return (
    <>
      <button
        type="button"
        aria-label="Abrir navegação"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="hard-shadow-sm fixed left-4 top-4 z-50 border-2 border-black bg-panel px-3 py-2 font-display text-3xl leading-none text-term transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
      >
        ▤
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar navegação clicando fora"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-ink/80"
          />
          <aside
            aria-label="Navegação"
            className="hard-shadow fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r-2 border-edge bg-panel p-4"
          >
            <div className="mb-6 flex items-center justify-between border-b-2 border-edge pb-3">
              <div>
                <p className="font-display text-3xl leading-none text-term">
                  TalkDoc<span className="blink">_</span>
                </p>
                <p className="mt-1 font-display text-xl leading-none text-cyanx">&gt; navegação</p>
              </div>
              <button
                type="button"
                aria-label="Fechar navegação"
                onClick={() => setOpen(false)}
                className="border-2 border-black bg-alarm px-3 py-1 font-display text-xl leading-none text-ink"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                aria-current={!atConversas ? 'page' : undefined}
                className={`border-2 px-4 py-3 font-display text-2xl ${
                  !atConversas
                    ? 'border-black bg-term text-ink'
                    : 'border-edge bg-ink text-term hover:border-term'
                }`}
              >
                &gt; DOCUMENTOS
              </Link>
              <Link
                to="/conversas"
                onClick={() => setOpen(false)}
                aria-current={atConversas ? 'page' : undefined}
                className={`border-2 px-4 py-3 font-display text-2xl ${
                  atConversas
                    ? 'border-black bg-term text-ink'
                    : 'border-edge bg-ink text-term hover:border-term'
                }`}
              >
                &gt; CONVERSAS
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  )
}

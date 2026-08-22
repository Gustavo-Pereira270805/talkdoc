import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Document } from '../api/documents'
import { useDocuments } from '../hooks/useDocuments'
import { useConversations, useCreateConversation } from '../hooks/useConversations'

function NewConversationSelector({ onClose }: { onClose: () => void }) {
  const { data: documents, isLoading } = useDocuments()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const create = useCreateConversation()
  const navigate = useNavigate()
  const ready = (documents ?? []).filter((document) => document.status === 'ready')

  function toggle(document: Document) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(document.id)) next.delete(document.id)
      else next.add(document.id)
      return next
    })
  }

  async function handleCreate() {
    if (!selected.size) {
      setError('Selecione ao menos um documento.')
      return
    }
    setError(null)
    try {
      const conversation = await create.mutateAsync([...selected])
      onClose()
      navigate(`/conversas/${conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conversa.')
    }
  }

  return (
    <div className="hard-shadow flex flex-col gap-3 border-2 border-edge bg-panel p-4">
      <p className="font-display text-2xl text-cyanx">&gt; nova conversa</p>
      {isLoading ? (
        <p className="text-sm text-fog blink">carregando documentos…</p>
      ) : !ready.length ? (
        <p className="text-sm text-fog">
          nenhum documento pronto para conversar — envie um PDF primeiro.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {ready.map((document) => (
            <label
              key={document.id}
              className={`flex cursor-pointer items-center gap-2 border-2 px-3 py-2 text-sm text-term ${
                selected.has(document.id)
                  ? 'border-term bg-term/10'
                  : 'border-edge bg-ink hover:border-term'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(document.id)}
                onChange={() => toggle(document)}
                className="h-4 w-4 accent-term"
              />
              {document.filename}
            </label>
          ))}
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="border-2 border-black bg-alarm px-3 py-2 text-sm font-semibold text-ink"
        >
          ✕ {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCreate}
          className="hard-shadow-sm border-2 border-black bg-term px-4 py-1.5 font-display text-xl text-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
        >
          CRIAR ▸
        </button>
        <button
          type="button"
          onClick={onClose}
          className="hard-shadow-sm border-2 border-black bg-edge px-4 py-1.5 font-display text-xl text-ink"
        >
          CANCELAR
        </button>
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  const { data: conversations, isLoading, isError, error } = useConversations()
  const [creating, setCreating] = useState(false)

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="font-display text-5xl leading-none text-term">
          TalkDoc<span className="blink">_</span>
        </h1>
      </header>

      <section aria-label="Conversas">
        <div className="mb-4 flex items-center justify-between border-b-2 border-edge pb-2">
          <h2 className="font-display text-3xl text-cyanx">&gt; Conversas</h2>
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            className="hard-shadow-sm border-2 border-black bg-term px-3 py-1 font-display text-xl text-ink hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            {creating ? 'FECHAR ✕' : 'NOVA CONVERSA ▸'}
          </button>
        </div>

        {creating && <NewConversationSelector onClose={() => setCreating(false)} />}

        {isLoading ? (
          <p className="text-sm text-fog blink">carregando conversas…</p>
        ) : isError ? (
          <p
            role="alert"
            className="inline-block border-2 border-black bg-alarm px-3 py-2 text-sm font-semibold text-ink"
          >
            ✕ {error instanceof Error ? error.message : 'Não foi possível carregar as conversas.'}
          </p>
        ) : !conversations?.length ? (
          <p className="text-sm text-fog">
            nenhuma conversa ainda — crie uma para perguntar sobre seus PDFs.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <a
                  href={`/conversas/${conversation.id}`}
                  className="hard-shadow flex items-center justify-between border-2 border-edge bg-panel px-4 py-3 hover:border-term"
                >
                  <span className="truncate font-mono font-semibold text-term">
                    {conversation.title}
                  </span>
                  <span className="font-display text-xl text-fog">▸</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

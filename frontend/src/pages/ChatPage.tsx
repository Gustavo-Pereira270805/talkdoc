import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { chatStream, type Message, type Reference } from '../api/conversations'
import { ApiError } from '../api/documents'
import { useConversationMessages, useConversations } from '../hooks/useConversations'
import ChatInput from '../components/ChatInput'
import ChatMessage, { AssistantMessage, ErrorMessage } from '../components/ChatMessage'
import PixelCatFront from '../components/PixelCatFront'

interface StreamState {
  text: string
  refs: Reference[]
  error: string | null
}

export default function ChatPage() {
  const { id } = useParams()
  return <ChatRoom key={id} conversationId={Number(id)} />
}

function ChatRoom({ conversationId }: { conversationId: number }) {
  const queryClient = useQueryClient()
  const { data: conversations } = useConversations()
  const { data: history, isLoading } = useConversationMessages(conversationId)
  const [stream, setStream] = useState<StreamState>({ text: '', refs: [], error: null })
  const [streaming, setStreaming] = useState(false)
  const [pending, setPending] = useState<Message | null>(null)
  const [showJump, setShowJump] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<StreamState>({ text: '', refs: [], error: null })
  const atBottomRef = useRef(true)

  const conversation = conversations?.find((item) => item.id === conversationId)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    if (atBottomRef.current) {
      scroller.scrollTop = scroller.scrollHeight
    }
  }, [history, stream, pending])

  function handleScroll() {
    const scroller = scrollerRef.current
    if (!scroller) return
    const nearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 80
    atBottomRef.current = nearBottom
    setShowJump(!nearBottom)
  }

  function scrollToBottom() {
    const scroller = scrollerRef.current
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight
      atBottomRef.current = true
      setShowJump(false)
    }
  }

  async function handleSubmit(question: string) {
    setPending({
      id: 0,
      role: 'user',
      content: question,
      refs: null,
      created_at: new Date().toISOString(),
    })
    setStream({ text: '', refs: [], error: null })
    streamRef.current = { text: '', refs: [], error: null }
    setStreaming(true)
    atBottomRef.current = true
    try {
      await chatStream(conversationId, question, (event) => {
        if (event.kind === 'token') {
          streamRef.current.text += String(event.data.token ?? '')
          setStream({ ...streamRef.current })
        } else if (event.kind === 'references') {
          streamRef.current.refs = (event.data.references as Reference[]) ?? []
          setStream({ ...streamRef.current })
        } else if (event.kind === 'error') {
          streamRef.current.error = String(event.data.message ?? 'Falha ao responder.')
          setStream({ ...streamRef.current })
        } else if (event.kind === 'done') {
          queryClient
            .invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] })
            .then(() => {
              setStream({ text: '', refs: [], error: null })
            })
        }
      })
    } catch (err) {
      setStream({
        ...streamRef.current,
        error: err instanceof ApiError ? err.message : 'Falha ao responder.',
      })
    } finally {
      setStreaming(false)
      setPending(null)
    }
  }

  const historyMessages = (history ?? []).filter((message) => message.id !== pending?.id)

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="font-display text-5xl leading-none text-term">
          TalkDoc<span className="blink">_</span>
        </h1>
      </header>

      <div className="flex flex-col gap-4">
        <h2 className="border-b-2 border-edge pb-2 font-display text-3xl text-cyanx">
          &gt; {conversation?.title ?? `conversa #${conversationId}`}
        </h2>
        <div className="relative">
          <PixelCatFront className="absolute -top-7 left-4 z-10 text-term" />
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="hard-shadow flex max-h-[60vh] min-h-[320px] flex-col gap-4 overflow-y-auto border-2 border-edge bg-panel p-4"
          >
            {isLoading ? (
              <p className="text-sm text-fog blink">carregando mensagens…</p>
            ) : historyMessages.length === 0 && !pending && !stream.text && !stream.error ? (
              <p className="text-sm text-fog">
                nenhuma mensagem ainda — pergunte algo sobre os documentos.
              </p>
            ) : (
              <>
                {historyMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {pending && <ChatMessage message={pending} />}
                {stream.text && (
                  <div className="flex flex-col gap-2" aria-live="polite">
                    <AssistantMessage content={stream.text} refs={stream.refs} />
                    {streaming && (
                      <span className="font-display text-lg text-fog">
                        transmitindo<span className="blink">▮</span>
                      </span>
                    )}
                  </div>
                )}
                {stream.error && <ErrorMessage message={stream.error} />}
                {streaming && !stream.text && !stream.error && (
                  <div className="flex items-center gap-2 text-fog">
                    <PixelCatFront size={30} />
                    <span className="font-display text-xl blink">pensando…</span>
                  </div>
                )}
              </>
            )}
            {showJump && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="sticky bottom-2 self-end border-2 border-black bg-cyanx px-3 py-1 font-display text-lg text-ink"
              >
                PULAR PARA O FIM ▾
              </button>
            )}
          </div>
        </div>
      </div>

      <ChatInput disabled={streaming} onSubmit={handleSubmit} />
    </main>
  )
}

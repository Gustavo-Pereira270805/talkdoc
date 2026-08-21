import DocumentList from '../components/DocumentList'
import PixelCat from '../components/PixelCat'
import UploadForm from '../components/UploadForm'

export default function UploadPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-4 py-8">
      <header>
        <h1 className="font-display text-5xl leading-none text-term">
          TalkDoc<span className="blink">_</span>
        </h1>
        <p className="mt-1 text-sm text-fog">
          &gt; converse com seus PDFs: envie um documento e pergunte sobre ele.
        </p>
      </header>
      <div className="relative">
        <PixelCat className="absolute -top-[38px] left-6 z-10" />
        <UploadForm />
      </div>
      <section aria-label="Documentos">
        <h2 className="mb-4 border-b-2 border-edge pb-2 font-display text-3xl text-cyanx">
          &gt; Documentos
        </h2>
        <DocumentList />
      </section>
    </main>
  )
}

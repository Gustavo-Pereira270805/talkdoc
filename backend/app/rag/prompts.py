from app.rag.retriever import RetrievedChunk


def build_system_prompt(context: str) -> str:
    return (
        "Você é um assistente que responde perguntas sobre documentos PDF fornecidos "
        "pelo usuário.\n"
        "Regras:\n"
        "- Responda SOMENTE com base no contexto abaixo, que contém trechos dos documentos.\n"
        "- Cada trecho tem um rótulo como [S1], [S2]... CITE o rótulo ao usar a informação.\n"
        "- Se a informação não estiver no contexto, diga claramente que não sabe (não invente).\n"
        "- Responda no mesmo idioma dos documentos e da pergunta.\n"
        "- Você pode usar **negrito**, *itálico* e `código` (o frontend renderiza); "
        "evite títulos (#), tabelas e outros formatos de markdown.\n"
        f"Contexto:\n{context}"
    )


def build_context(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "(nenhum trecho relevante foi encontrado nos documentos)"
    parts = [
        f"[S{index}] (documento: {chunk.filename}, página {chunk.page})\n{chunk.text}"
        for index, chunk in enumerate(chunks, start=1)
    ]
    return "\n\n".join(parts)
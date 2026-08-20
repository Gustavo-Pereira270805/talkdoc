from app.rag.chunker import PageText, chunk_document, chunk_tokens, estimate_tokens


def _text(num_tokens: int) -> str:
    return " ".join(f"token_{i}" for i in range(num_tokens))


def test_estima_tokens_por_palavras() -> None:
    assert estimate_tokens("um dois tres") == 3


def test_texto_curto_gera_um_chunk() -> None:
    pages = [PageText(page_number=1, text=_text(10))]
    chunks = chunk_document(pages)
    assert len(chunks) == 1
    assert chunks[0].token_count == 10


def test_texto_longo_divide_em_varios_chunks() -> None:
    pages = [PageText(page_number=1, text=_text(2000))]
    chunks = chunk_document(pages, chunk_size=800, overlap_ratio=0.15)
    assert len(chunks) == 3
    for chunk in chunks:
        assert chunk.token_count <= 800
    # o ultimo chunk pode ser menor (640); os dois primeiros tem 800
    assert chunks[0].token_count == 800
    assert chunks[1].token_count == 800
    assert chunks[2].token_count == 640


def test_overlap_repeticao_de_tokens() -> None:
    pages = [PageText(page_number=1, text=_text(30))]
    chunks = chunk_document(pages, chunk_size=10, overlap_ratio=0.1)
    parts = [chunk.text.split() for chunk in chunks]
    assert parts[0] == [f"token_{i}" for i in range(10)]
    assert parts[1] == [f"token_{i}" for i in range(9, 19)]


def test_nunca_corta_palavra_no_meio() -> None:
    pages = [PageText(page_number=1, text=_text(100))]
    chunks = chunk_document(pages, chunk_size=10, overlap_ratio=0.1)
    seq: list[str] = []
    seen: set[str] = set()
    for chunk in chunks:
        for word in chunk.text.split():
            if word not in seen:
                seq.append(word)
                seen.add(word)
    assert seq == [f"token_{i}" for i in range(100)]


def test_chunks_nao_cruzam_paginas() -> None:
    pages = [
        PageText(page_number=1, text=_text(25)),
        PageText(page_number=2, text=_text(25)),
    ]
    chunks = chunk_document(pages, chunk_size=10, overlap_ratio=0.1)
    assert {chunk.page for chunk in chunks} == {1, 2}
    assert all(chunk.page == 1 for chunk in chunks[:3])
    assert all(chunk.page == 2 for chunk in chunks[3:])


def test_pagina_no_metadata() -> None:
    pages = [PageText(page_number=7, text=_text(50))]
    chunks = chunk_document(pages, chunk_size=30, overlap_ratio=0.1)
    assert all(chunk.page == 7 for chunk in chunks)


def test_pagina_vazia_ignorada() -> None:
    pages = [
        PageText(page_number=1, text="   \n  "),
        PageText(page_number=2, text=_text(5)),
    ]
    chunks = chunk_document(pages)
    assert len(chunks) == 1
    assert chunks[0].page == 2


def test_chunk_tokens_overlap_nao_regride() -> None:
    parts = chunk_tokens([f"t{i}" for i in range(30)], chunk_size=10, overlap=12)
    assert all(len(part) <= 10 for part in parts)
    # overlap >= chunk_size e clampado para avancar pelo menos 1 token
    assert parts[1][0] == "t1"

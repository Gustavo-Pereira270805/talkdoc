from dataclasses import dataclass

DEFAULT_CHUNK_SIZE = 800
DEFAULT_OVERLAP_RATIO = 0.15


@dataclass
class PageText:
    page_number: int
    text: str


@dataclass
class Chunk:
    text: str
    page: int
    token_count: int


def estimate_tokens(text: str) -> int:
    return len(text.split())


def tokenize(text: str) -> list[str]:
    return text.split()


def chunk_tokens(tokens: list[str], chunk_size: int, overlap: int) -> list[list[str]]:
    """Divide a lista de tokens em janelas de `chunk_size` com `overlap` tokens repetidos.

    As divisões caem sempre em fronteira de token (nunca corta palavra no meio).
    """
    chunks: list[list[str]] = []
    start = 0
    total = len(tokens)
    while start < total:
        end = min(start + chunk_size, total)
        chunks.append(tokens[start:end])
        if end == total:
            break
        next_start = start + chunk_size - overlap
        if next_start <= start:
            next_start = start + 1
        start = next_start
    return chunks


def chunk_document(
    pages: list[PageText],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap_ratio: float = DEFAULT_OVERLAP_RATIO,
) -> list[Chunk]:
    """Gera chunks por página: ~chunk_size tokens, overlap de overlap_ratio, página no metadata.

    Cada chunk pertence a uma única página (primeiro token define a página de referência).
    """
    overlap = max(1, int(chunk_size * overlap_ratio))
    chunks: list[Chunk] = []
    for page in pages:
        if not page.text.strip():
            continue
        tokens = tokenize(page.text)
        for part in chunk_tokens(tokens, chunk_size, overlap):
            chunks.append(
                Chunk(
                    text=" ".join(part),
                    page=page.page_number,
                    token_count=len(part),
                )
            )
    return chunks

from pathlib import Path

import pymupdf

from app.rag.chunker import PageText


def extract_pages(pdf_path: str | Path) -> list[PageText]:
    """Extrai o texto de cada página do PDF (camada de texto, sem OCR)."""
    document = pymupdf.open(str(pdf_path))
    try:
        pages: list[PageText] = []
        for index in range(len(document)):
            page = document[index]
            pages.append(PageText(page_number=index + 1, text=page.get_text()))
        return pages
    finally:
        document.close()

import re
import unicodedata
import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile


class UploadValidationError(Exception):
    """Erro de validação de upload (mapeado para 400)."""


class NotPdfError(UploadValidationError):
    """Arquivo não é um PDF válido (mapeado para 415)."""


class UploadTooLargeError(UploadValidationError):
    """Arquivo excede o limite de tamanho (mapeado para 413)."""


@dataclass
class StoredUpload:
    original_filename: str
    stored_filename: str
    path: Path


def sanitize_filename(filename: str) -> str:
    """Remove caminhos, acentos e caracteres inseguros; garante extensão .pdf."""
    base = Path(filename).name
    base = unicodedata.normalize("NFKD", base).encode("ascii", "ignore").decode("ascii")
    stem = Path(base).stem
    stem = re.sub(r"[^A-Za-z0-9]+", "_", stem)
    stem = re.sub(r"_+", "_", stem).strip("_")
    if not stem:
        raise UploadValidationError("Nome de arquivo inválido.")
    return f"{stem}.pdf"


class UploadService:
    CHUNK_SIZE = 64 * 1024
    PDF_MAGIC = b"%PDF"

    def __init__(self, upload_dir: Path, max_upload_size: int):
        self.upload_dir = upload_dir
        self.max_upload_size = max_upload_size
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def validate_and_store(self, file: UploadFile) -> StoredUpload:
        filename = sanitize_filename(file.filename or "")
        stored_filename = f"{uuid.uuid4().hex}.pdf"
        dest = self.upload_dir / stored_filename

        head = await file.read(len(self.PDF_MAGIC))
        if not head:
            raise UploadValidationError("O arquivo está vazio.")
        if not head.startswith(self.PDF_MAGIC):
            raise NotPdfError("O arquivo não é um PDF válido (magic bytes não conferem).")

        size = len(head)
        too_large = False
        with dest.open("wb") as out:
            out.write(head)
            while chunk := await file.read(self.CHUNK_SIZE):
                size += len(chunk)
                if size > self.max_upload_size:
                    too_large = True
                    break
                out.write(chunk)

        if too_large:
            dest.unlink(missing_ok=True)
            raise UploadTooLargeError("Arquivo excede o limite de 20MB.")

        return StoredUpload(
            original_filename=filename,
            stored_filename=stored_filename,
            path=dest,
        )


def get_upload_service() -> UploadService:
    from app.core.config import settings

    return UploadService(
        upload_dir=Path(settings.upload_dir),
        max_upload_size=settings.max_upload_size_mb * 1024 * 1024,
    )

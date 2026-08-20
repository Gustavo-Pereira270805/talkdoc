from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.schemas import DocumentOut
from app.db.deps import get_db
from app.repositories.documents import DocumentRepository
from app.services.upload import (
    NotPdfError,
    UploadService,
    UploadTooLargeError,
    UploadValidationError,
    get_upload_service,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentOut, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    upload: UploadService = Depends(get_upload_service),
) -> DocumentOut:
    try:
        stored = await upload.validate_and_store(file)
    except NotPdfError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc)
        ) from exc
    except UploadTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(exc)
        ) from exc
    except UploadValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    document = DocumentRepository(db).create(
        filename=stored.original_filename,
        stored_filename=stored.stored_filename,
    )
    return DocumentOut.model_validate(document)

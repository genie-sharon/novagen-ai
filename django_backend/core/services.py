"""Document validation service for the NovaGen Django companion API.

Provides reusable validation logic for checking file types, sizes,
and naming constraints before upload.
"""

import os

SUPPORTED_EXTENSIONS: set = {".txt", ".csv", ".docx", ".pdf"}
MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024


def validate_document(filename: str, size_bytes: int) -> tuple[bool, str]:
    """Validate a document file by its name and size.

    Args:
        filename: The name of the file including its extension.
        size_bytes: The size of the file in bytes.

    Returns:
        A tuple of (is_valid, message). When valid, message is a
        success string. When invalid, message describes the error.
    """
    if not filename or not filename.strip():
        return False, "Filename is empty."

    if size_bytes < 0:
        return False, "File size cannot be negative."

    _, extension = os.path.splitext(filename)
    lower_extension = extension.lower()
    supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))

    if not extension or lower_extension not in SUPPORTED_EXTENSIONS:
        message = (
            f"Unsupported file type '{extension}'. Supported types: {supported}."
            if extension
            else f"File has no extension. Supported types: {supported}."
        )
        return False, message

    if lower_extension == ".doc":
        return False, "Legacy .doc files are not supported. Convert the file to .docx."

    max_mb = int(MAX_FILE_SIZE_BYTES / (1024 * 1024))

    if size_bytes > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds the maximum allowed size of {max_mb} MB."

    return True, "Document is valid."

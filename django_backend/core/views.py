"""JSON API views for the NovaGen Django companion backend.

Provides endpoints for health checks, supported document types,
and document validation.
"""

import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from core.services import SUPPORTED_EXTENSIONS, MAX_FILE_SIZE_BYTES, validate_document


@require_http_methods(["GET"])
def root(request):
    """Return a root welcome message with available endpoints."""
    return JsonResponse({
        "status": "ok",
        "service": "NovaGen Django companion API",
        "message": "Use /api/health/, /api/document-types/ or /api/validate-document/.",
    })


@require_http_methods(["GET"])
def health(request):
    """Return a simple health-check response."""
    return JsonResponse(
        {"status": "ok", "service": "NovaGen Django companion API"}
    )


@require_http_methods(["GET"])
def document_types(request):
    """Return the list of supported document types and size limit."""
    extensions = sorted(
        ext.lstrip(".") for ext in SUPPORTED_EXTENSIONS
    )
    max_size_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
    return JsonResponse(
        {"supported_types": extensions, "max_size_mb": max_size_mb}
    )


@require_http_methods(["POST"])
def validate_document_view(request):
    """Validate a document submission via JSON body.

    Expects JSON with 'filename' (str) and 'size_bytes' (int).
    Returns 200 on success or 400 with a descriptive error.
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON in request body."}, status=400
        )

    filename = data.get("filename")
    size_bytes = data.get("size_bytes")

    if filename is None:
        return JsonResponse(
            {"error": "Missing required field 'filename'."}, status=400
        )

    if size_bytes is None:
        return JsonResponse(
            {"error": "Missing required field 'size_bytes'."}, status=400
        )

    if not isinstance(size_bytes, int):
        return JsonResponse(
            {"error": "Field 'size_bytes' must be an integer."}, status=400
        )

    is_valid, message = validate_document(filename, size_bytes)

    if is_valid:
        return JsonResponse({"valid": True, "message": message})

    return JsonResponse({"valid": False, "error": message}, status=400)

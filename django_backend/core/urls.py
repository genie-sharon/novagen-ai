"""URL routing for the core application."""

from django.urls import path

from core.views import health, document_types, validate_document_view

urlpatterns = [
    path("health/", health, name="health"),
    path("document-types/", document_types, name="document-types"),
    path("validate-document/", validate_document_view, name="validate-document"),
]

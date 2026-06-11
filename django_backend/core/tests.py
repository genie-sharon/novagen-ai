"""Automated tests for the NovaGen Django companion API."""

import json

from django.test import TestCase, Client


class RootEndpointTests(TestCase):
    """Tests for the GET / root endpoint."""

    def setUp(self):
        self.client = Client()

    def test_root_returns_200(self):
        """Root endpoint returns HTTP 200."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

    def test_root_identifies_novagen(self):
        """Root response identifies NovaGen."""
        response = self.client.get("/")
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("NovaGen", data["service"])

    def test_root_includes_message(self):
        """Root response includes usage message."""
        response = self.client.get("/")
        data = response.json()
        self.assertIn("message", data)


class HealthEndpointTests(TestCase):
    """Tests for the GET /api/health/ endpoint."""

    def setUp(self):
        self.client = Client()

    def test_health_returns_200(self):
        """Health endpoint returns HTTP 200."""
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)

    def test_health_identifies_novagen(self):
        """Health response identifies NovaGen in the service field."""
        response = self.client.get("/api/health/")
        data = response.json()
        self.assertIn("NovaGen", data["service"])


class DocumentTypesEndpointTests(TestCase):
    """Tests for the GET /api/document-types/ endpoint."""

    def setUp(self):
        self.client = Client()

    def test_document_types_returns_200(self):
        """Document-types endpoint returns HTTP 200."""
        response = self.client.get("/api/document-types/")
        self.assertEqual(response.status_code, 200)

    def test_document_types_includes_all_formats(self):
        """Response lists txt, csv, docx, and pdf."""
        response = self.client.get("/api/document-types/")
        data = response.json()
        for ext in ("txt", "csv", "docx", "pdf"):
            self.assertIn(ext, data["supported_types"])


class ValidateDocumentEndpointTests(TestCase):
    """Tests for the POST /api/validate-document/ endpoint."""

    def setUp(self):
        self.client = Client()

    def _post(self, payload):
        return self.client.post(
            "/api/validate-document/",
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_txt_validation_succeeds(self):
        """TXT file validation passes."""
        response = self._post({"filename": "notes.txt", "size_bytes": 1024})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_csv_validation_succeeds(self):
        """CSV file validation passes."""
        response = self._post({"filename": "data.csv", "size_bytes": 512})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_docx_validation_succeeds(self):
        """DOCX file validation passes."""
        response = self._post({"filename": "report.docx", "size_bytes": 4096})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_pdf_validation_succeeds(self):
        """PDF file validation passes."""
        response = self._post({"filename": "doc.pdf", "size_bytes": 2048})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_uppercase_pdf_validation_succeeds(self):
        """Uppercase .PDF extension validation passes."""
        response = self._post({"filename": "DOCUMENT.PDF", "size_bytes": 1024})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["valid"])

    def test_legacy_doc_fails(self):
        """Legacy .doc files are rejected with a clear message."""
        response = self._post({"filename": "old.doc", "size_bytes": 1024})
        self.assertEqual(response.status_code, 400)
        self.assertIn(".doc", response.json()["error"])

    def test_unsupported_extension_fails(self):
        """Unsupported file extensions are rejected."""
        response = self._post({"filename": "image.png", "size_bytes": 1024})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["valid"])

    def test_oversized_file_fails(self):
        """Files larger than 20 MB are rejected."""
        response = self._post({"filename": "large.pdf", "size_bytes": 21 * 1024 * 1024})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["valid"])

    def test_negative_file_size_fails(self):
        """Negative file sizes are rejected."""
        response = self._post({"filename": "file.pdf", "size_bytes": -1})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["valid"])

    def test_empty_filename_fails(self):
        """Empty filenames are rejected."""
        response = self._post({"filename": "", "size_bytes": 1024})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["valid"])

    def test_missing_filename_returns_400(self):
        """Missing filename field returns HTTP 400."""
        response = self._post({"size_bytes": 1024})
        self.assertEqual(response.status_code, 400)
        self.assertIn("filename", response.json()["error"])

    def test_missing_size_returns_400(self):
        """Missing size_bytes field returns HTTP 400."""
        response = self._post({"filename": "test.pdf"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("size_bytes", response.json()["error"])

    def test_invalid_json_returns_400(self):
        """Malformed JSON body returns HTTP 400."""
        response = self.client.post(
            "/api/validate-document/",
            data="not-json",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid JSON", response.json()["error"])

    def test_non_integer_size_returns_400(self):
        """Non-integer size_bytes returns HTTP 400."""
        response = self._post({"filename": "test.pdf", "size_bytes": "large"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("must be an integer", response.json()["error"])

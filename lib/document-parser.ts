import "server-only";
import mammoth from "mammoth";
import path from "node:path";

const TXT_TYPE = "text/plain";
const CSV_TYPE = "text/csv";
const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function ensureText(text: string, message: string): string {
  const cleaned = text.trim();

  if (!cleaned) {
    throw new Error(message);
  }

  return cleaned;
}

export function detectDocumentType(
  fileName: string,
  browserMimeType: string
): string {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".txt") return TXT_TYPE;
  if (extension === ".csv") return CSV_TYPE;
  if (extension === ".pdf") return PDF_TYPE;
  if (extension === ".docx") return DOCX_TYPE;

  if (extension === ".doc") {
    throw new Error(
      "Legacy .doc files are not supported. Convert the file to .docx and upload it again."
    );
  }

  if (
    browserMimeType === TXT_TYPE ||
    browserMimeType === CSV_TYPE ||
    browserMimeType === PDF_TYPE ||
    browserMimeType === DOCX_TYPE
  ) {
    return browserMimeType;
  }

  throw new Error(
    "Unsupported file type. Upload a TXT, CSV, DOCX, or PDF file."
  );
}

export async function extractText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === TXT_TYPE || mimeType === CSV_TYPE) {
    return ensureText(
      fileBuffer.toString("utf-8"),
      "The uploaded TXT or CSV file is empty."
    );
  }

  if (mimeType === DOCX_TYPE) {
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return ensureText(
      result.value,
      "No extractable text was found in the DOCX file."
    );
  }

  if (mimeType === PDF_TYPE) {
    const { CanvasFactory } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");

    const parser = new PDFParse({
      data: new Uint8Array(fileBuffer),
      CanvasFactory,
    });

    try {
      const result = await parser.getText();
      const text = result.text.trim();

      if (!text) {
        throw new Error(
          "No extractable text was found in this PDF. The PDF may be scanned or image-only."
        );
      }

      return text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(
    "Unsupported file type. Upload a TXT, CSV, DOCX, or PDF file."
  );
}

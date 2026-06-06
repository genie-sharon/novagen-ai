import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. sample.txt
fs.writeFileSync(
  path.join(__dirname, "sample.txt"),
  `NovaGen is a document question-answering application.
NovaGen uses Gemini artificial intelligence.
The interface uses a pastel pink theme.
The project supports TXT, CSV, DOCX, and selectable-text PDF files.
Users can upload documents and ask questions about them.
The application uses pgvector for similarity search.`,
  "utf-8"
);

// 2. sample.csv
fs.writeFileSync(
  path.join(__dirname, "sample.csv"),
  `name,role,location
Asha,Engineer,Coimbatore
Ravi,Designer,Chennai
Priya,Manager,Bangalore
Kumar,Developer,Hyderabad`,
  "utf-8"
);

// 3. sample-empty.txt
fs.writeFileSync(path.join(__dirname, "sample-empty.txt"), "", "utf-8");

// 4. unsupported.doc (legacy format, just a text file renamed)
fs.writeFileSync(
  path.join(__dirname, "unsupported.doc"),
  "This is a legacy .doc file content that should be rejected.",
  "utf-8"
);

// 5. sample-large.txt (just over 350 words to test chunking)
const longText = `NovaGen `.repeat(500);
fs.writeFileSync(
  path.join(__dirname, "sample-large.txt"),
  longText.trim(),
  "utf-8"
);

// 6. sample.docx — create a minimal DOCX programmatically
// A DOCX is a ZIP file; we use a known minimal approach
async function createDocx() {
  try {
    // Check if mammoth is available to verify
    const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>NovaGen is a document question-answering application. NovaGen uses Gemini artificial intelligence. The interface uses a pastel pink theme.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

    const tmpDir = path.join(__dirname, ".tmp-docx");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "word"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "_rels"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "word", "document.xml"), content, "utf-8");
    fs.writeFileSync(path.join(tmpDir, "_rels", ".rels"), rels, "utf-8");
    fs.writeFileSync(path.join(tmpDir, "[Content_Types].xml"), contentTypes, "utf-8");

    // Use PowerShell to create a ZIP, then rename to .docx
    const zipPath = path.join(__dirname, "temp-docx.zip");
    const docxPath = path.join(__dirname, "sample.docx");
    const zipCmd = `powershell -Command "Compress-Archive -Path '${tmpDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    execSync(zipCmd, { stdio: "pipe" });

    if (fs.existsSync(zipPath)) {
      fs.renameSync(zipPath, docxPath);
      console.log("Created sample.docx");
    }

    // Clean up temp
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err) {
    console.error("Failed to create DOCX:", err.message);
    // Create a minimal placeholder note
    fs.writeFileSync(
      path.join(__dirname, "sample.docx"),
      "Placeholder for DOCX - run fixtures generator with mammoth available",
      "utf-8"
    );
  }
}

// 7. sample-selectable-text.pdf — minimal valid PDF
function createMinimalPdf(text) {
  // Minimal PDF with selectable text
  const content = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 720 Td (${text}) Tj ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000360 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`.trim();

  return content;
}

// 8. sample-image-only-placeholder.pdf — minimal PDF with no selectable text
function createEmptyPdf() {
  const content = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj

4 0 obj
<< /Length 0 >>
stream

endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000225 00000 n 

trailer
<< /Size 5 /Root 1 0 R >>
startxref
315
%%EOF`.trim();

  return content;
}

function createPdfFile(filename, content) {
  // PDF needs proper binary formatting - use raw bytes approach
  const header = "%PDF-1.4\n";
  const data = header + content;
  fs.writeFileSync(path.join(__dirname, filename), data, "utf-8");
  console.log(`Created ${filename}`);
}

async function main() {
  console.log("Generating test fixtures...");

  // Text-based files
  console.log("Created sample.txt, sample.csv, sample-empty.txt, unsupported.doc, sample-large.txt");

  // PDF files
  createPdfFile("sample-selectable-text.pdf", createMinimalPdf("NovaGen document question-answering application Gemini AI"));
  createPdfFile("sample-image-only-placeholder.pdf", createEmptyPdf());

  // DOCX
  await createDocx();

  console.log("All fixtures generated.");
}

main().catch(console.error);

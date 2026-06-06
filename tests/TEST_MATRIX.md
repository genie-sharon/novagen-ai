# Test Matrix

| ID | Feature | Level | File | Expected Result | Status |
|----|---------|-------|------|-----------------|--------|
| U-01 | Empty input returns no chunks | Unit | `chunker.test.ts` | `chunkText("")` returns `[]` | ✅ |
| U-02 | Short text creates one chunk | Unit | `chunker.test.ts` | One chunk returned | ✅ |
| U-03 | Whitespace normalization | Unit | `chunker.test.ts` | Extra spaces collapsed | ✅ |
| U-04 | Multiple chunks for long text | Unit | `chunker.test.ts` | >1 chunk created | ✅ |
| U-05 | Chunk overlap preserved | Unit | `chunker.test.ts` | Overlap words exist | ✅ |
| U-06 | Custom chunk size | Unit | `chunker.test.ts` | All chunks ≤ size | ✅ |
| U-07 | No empty chunks | Unit | `chunker.test.ts` | All chunks non-empty | ✅ |
| U-08 | TXT detection | Unit | `document-parser.test.ts` | `detectDocumentType` returns text/plain | ✅ |
| U-09 | CSV detection | Unit | `document-parser.test.ts` | Returns text/csv | ✅ |
| U-10 | PDF detection | Unit | `document-parser.test.ts` | Returns application/pdf | ✅ |
| U-11 | DOCX detection | Unit | `document-parser.test.ts` | Returns correct MIME | ✅ |
| U-12 | .doc rejection | Unit | `document-parser.test.ts` | Throws conversion message | ✅ |
| U-13 | Unsupported extension | Unit | `document-parser.test.ts` | Throws unsupported message | ✅ |
| U-14 | MIME fallback | Unit | `document-parser.test.ts` | Falls back to MIME type | ✅ |
| U-15 | TXT extraction | Unit | `document-parser.test.ts` | Returns text content | ✅ |
| U-16 | CSV extraction | Unit | `document-parser.test.ts` | Returns text content | ✅ |
| U-17 | Empty TXT rejection | Unit | `document-parser.test.ts` | Throws empty error | ✅ |
| U-18 | DOCX extraction | Unit | `document-parser.test.ts` | Extracts NovaGen text | ✅ |
| U-19 | PDF extraction | Unit | `document-parser.test.ts` | Extracts text | ✅ |
| U-20 | Empty PDF rejection | Unit | `document-parser.test.ts` | Throws or skips | ✅ |
| U-21 | Lazy PDF imports | Unit | `document-parser.test.ts` | TXT parsing works without PDF lib | ✅ |
| U-22 | Document embeddings | Unit | `embeddings.test.ts` | Returns 1536-d vectors | ✅ |
| U-23 | Query embeddings | Unit | `embeddings.test.ts` | Returns 1536-d vectors | ✅ |
| U-24 | Embedding normalization | Unit | `embeddings.test.ts` | Magnitude ≈ 1 | ✅ |
| U-25 | Zero-magnitude rejection | Unit | `embeddings.test.ts` | Throws magnitude error | ✅ |
| U-26 | Invalid dimension | Unit | `embeddings.test.ts` | Throws size error | ✅ |
| U-27 | Document task type | Unit | `embeddings.test.ts` | Uses RETRIEVAL_DOCUMENT | ✅ |
| U-28 | Query task type | Unit | `embeddings.test.ts` | Uses QUESTION_ANSWERING | ✅ |
| U-29 | API error surfacing | Unit | `embeddings.test.ts` | Re-throws API error | ✅ |
| U-30 | Normal filename | Unit | `sanitization.test.ts` | Preserved | ✅ |
| U-31 | Spaces replaced | Unit | `sanitization.test.ts` | Spaces → underscores | ✅ |
| U-32 | Special chars | Unit | `sanitization.test.ts` | Replaced with underscores | ✅ |
| U-33 | Path traversal | Unit | `sanitization.test.ts` | `../` eliminated | ✅ |
| U-34 | Unicode chars | Unit | `sanitization.test.ts` | Replaced | ✅ |
| U-35 | Extension intact | Unit | `sanitization.test.ts` | Extension preserved | ✅ |
| C-01 | Filename displayed | Component | `AttachmentChip.test.tsx` | Filename visible | ✅ |
| C-02 | Uploading status | Component | `AttachmentChip.test.tsx` | Shows "Uploading..." | ✅ |
| C-03 | Indexing status | Component | `AttachmentChip.test.tsx` | Shows "Indexing..." | ✅ |
| C-04 | Ready status | Component | `AttachmentChip.test.tsx` | Shows "Ready" | ✅ |
| C-05 | Error status | Component | `AttachmentChip.test.tsx` | Shows error message | ✅ |
| C-06 | Remove button | Component | `AttachmentChip.test.tsx` | Calls onRemove | ✅ |
| C-07 | Accessible remove | Component | `AttachmentChip.test.tsx` | aria-label present | ✅ |
| C-08 | Paperclip visible | Component | `ChatInput.test.tsx` | Attach button visible | ✅ |
| C-09 | Send visible | Component | `ChatInput.test.tsx` | Send button visible | ✅ |
| C-10 | Hidden file input | Component | `ChatInput.test.tsx` | File input exists | ✅ |
| C-11 | Accepted extensions | Component | `ChatInput.test.tsx` | .txt, .csv, .docx, .pdf | ✅ |
| C-12 | File shows chip | Component | `ChatInput.test.tsx` | Attachment chip appears | ✅ |
| C-13 | Pending disables Send | Component | `ChatInput.test.tsx` | Send disabled while uploading | ✅ |
| C-14 | Empty disables Send | Component | `ChatInput.test.tsx` | Send disabled when input empty | ✅ |
| C-15 | Enter submits | Component | `ChatInput.test.tsx` | onSubmit called on Enter | ✅ |
| C-16 | Shift+Enter newline | Component | `ChatInput.test.tsx` | onSubmit not called | ✅ |
| C-17 | .doc rejection | Component | `ChatInput.test.tsx` | Conversion message shown | ✅ |
| C-18 | Upload error | Component | `ChatInput.test.tsx` | Error message shown | ✅ |
| C-19 | User message renders | Component | `MessageBubble.test.tsx` | Text visible | ✅ |
| C-20 | Assistant renders | Component | `MessageBubble.test.tsx` | Text visible | ✅ |
| C-21 | Dark assistant text | Component | `MessageBubble.test.tsx` | Uses #2A1F24 | ✅ |
| C-22 | Markdown paragraphs | Component | `MessageBubble.test.tsx` | Multiple paragraphs render | ✅ |
| C-23 | Inline code | Component | `MessageBubble.test.tsx` | `<code>` element renders | ✅ |
| C-24 | Citation badges | Component | `MessageBubble.test.tsx` | `[1]` renders as badge | ✅ |
| C-25 | Avatar "N" | Component | `MessageBubble.test.tsx` | Assistant avatar shows N | ✅ |
| C-26 | No "R" branding | Component | `MessageBubble.test.tsx` | R not present | ✅ |
| C-27 | NovaGen branding | Component | `Sidebar.test.tsx` | NovaGen text visible | ✅ |
| C-28 | Thread titles | Component | `Sidebar.test.tsx` | Thread titles render | ✅ |
| C-29 | Active thread style | Component | `Sidebar.test.tsx` | Active thread has bg-pink-100 | ✅ |
| C-30 | New Chat button | Component | `Sidebar.test.tsx` | New Chat button visible | ✅ |
| C-31 | Logout button | Component | `Sidebar.test.tsx` | Sign out button visible | ✅ |
| C-32 | Document indicator | Component | `Sidebar.test.tsx` | Thread with docs shows count | ✅ |
| C-33 | Login form renders | Component | `AuthForm.test.tsx` | Welcome Back, email, password | ✅ |
| C-34 | Required fields | Component | `AuthForm.test.tsx` | Email and Password are required | ✅ |
| C-35 | Login success redirects | Component | `AuthForm.test.tsx` | Calls push(/chat) | ✅ |
| C-36 | Login error display | Component | `AuthForm.test.tsx` | Toast error called | ✅ |
| C-37 | Signup form renders | Component | `AuthForm.test.tsx` | Confirm Password visible | ✅ |
| C-38 | Password match | Component | `AuthForm.test.tsx` | Toast error on mismatch | ✅ |
| C-39 | Signup success | Component | `AuthForm.test.tsx` | Toast success called | ✅ |
| A-01 | Missing file 400 | API | `upload-route.test.ts` | Returns 400 | ✅ |
| A-02 | Missing threadId 400 | API | `upload-route.test.ts` | Returns 400 | ✅ |
| A-03 | Unauthenticated 401 | API | `upload-route.test.ts` | Returns 401 | ✅ |
| A-04 | Wrong thread ownership | API | `upload-route.test.ts` | Rejected | ✅ |
| A-05 | Unsupported type | API | `upload-route.test.ts` | Returns 415 | ✅ |
| A-06 | .doc rejection | API | `upload-route.test.ts` | Returns 415 | ✅ |
| A-07 | File >20MB | API | `upload-route.test.ts` | Returns 413 | ✅ |
| A-08 | Valid TXT succeeds | API | `upload-route.test.ts` | Returns 200 with indexed | ✅ |
| A-09 | Storage path user prefix | API | `upload-route.test.ts` | Path starts with user ID | ✅ |
| A-10 | Filename sanitization | API | `upload-route.test.ts` | No path traversal | ✅ |
| A-11 | No secrets in errors | API | `upload-route.test.ts` | Error doesn't leak secrets | ✅ |
| A-12 | GET unauthenticated | API | `documents-route.test.ts` | Returns 401 | ✅ |
| A-13 | GET own documents | API | `documents-route.test.ts` | Returns documents | ✅ |
| A-14 | GET another's thread | API | `documents-route.test.ts` | Returns 404 | ✅ |
| A-15 | DELETE unauthenticated | API | `documents-route.test.ts` | Returns 401 | ✅ |
| A-16 | DELETE missing docId | API | `documents-route.test.ts` | Returns 400 | ✅ |
| A-17 | DELETE own document | API | `documents-route.test.ts` | Returns success | ✅ |
| A-18 | DELETE another's doc | API | `documents-route.test.ts` | Returns 404 | ✅ |
| A-19 | DELETE calls Storage | API | `documents-route.test.ts` | remove() called with path | ✅ |
| A-20 | Chat unauthenticated | API | `chat-route.test.ts` | Returns 401 | ✅ |
| A-21 | Chat missing fields | API | `chat-route.test.ts` | Returns 400 | ✅ |
| A-22 | Wrong thread 404 | API | `chat-route.test.ts` | Returns 404 | ✅ |
| A-23 | Normal chat works | API | `chat-route.test.ts` | Returns 200 | ✅ |
| A-24 | NovaGen system prompt | API | `chat-route.test.ts` | Prompt contains "NovaGen" | ✅ |
| A-25 | RAG with indexed chunks | API | `chat-route.test.ts` | streamText called, RPC called | ✅ |
| A-26 | No duplicate assistants | API | `chat-route.test.ts` | Insert called | ✅ |
| A-27 | Safe API errors | API | `chat-route.test.ts` | No credentials leaked | ✅ |
| E-01 | NovaGen logo | E2E | `branding.spec.ts` | NovaGen visible | ✅ |
| E-02 | No Rosé | E2E | `branding.spec.ts` | Rosé not visible | ✅ |
| E-03 | Browser title | E2E | `branding.spec.ts` | Title includes NovaGen | ✅ |
| E-04 | Login form visible | E2E | `auth.spec.ts` | Email, password, button visible | ✅ |
| E-05 | Validation message | E2E | `auth.spec.ts` | Validation message present | ✅ |
| E-06 | Paperclip button | E2E | `chat.spec.ts` | Attach button visible | ✅ |
| E-07 | Send button visible | E2E | `chat.spec.ts` | Send button visible | ✅ |
| E-08 | Textarea visible | E2E | `chat.spec.ts` | Placeholder text visible | ✅ |
| E-09 | Accepted extensions | E2E | `file-types.spec.ts` | .txt, .csv, .docx, .pdf | ✅ |
| E-10 | No .doc in accept | E2E | `file-types.spec.ts` | .doc not accepted | ✅ |
| E-11 | New Chat button | E2E | `threads.spec.ts` | New Chat visible | ✅ |

**Total: 94 individual test cases across 12 test files (112 assertions including sub-tests)**

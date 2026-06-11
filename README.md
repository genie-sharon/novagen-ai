# NovaGen — AI Chat and Document Q&A Application

NovaGen is an AI-powered conversational assistant inspired by ChatGPT. It allows users to create accounts, continue previous conversations, upload documents, and ask questions based on the information contained in those documents.

The application uses Gemini AI for response generation and embeddings, Supabase for authentication, database storage and document storage, and a Retrieval-Augmented Generation (RAG) pipeline for document-based question answering.

## Live Application

[Open NovaGen on Vercel](https://novagen-ai-sigma.vercel.app)

## Source Code

[View the GitHub Repository](https://github.com/genie-sharon/novagen-ai)

---

## Main Features

### AI Chat

* Gemini-powered conversational assistant
* ChatGPT-inspired interface
* Persistent chat-thread history
* Ability to reopen and continue previous conversations
* Readable streamed AI responses
* Safe error handling for temporary AI usage limits

### Authentication

* User signup
* User login
* User logout
* Protected chat routes
* User-specific chat history

### Document Question Answering

* Upload documents using a compact paperclip attachment interface
* Ask questions beneath the attached file
* Extract text from uploaded documents
* Split documents into searchable chunks
* Generate embeddings using Gemini
* Store indexed chunks in Supabase
* Retrieve relevant document excerpts
* Generate grounded answers using RAG

### Supported Document Types

* TXT
* CSV
* DOCX
* Selectable-text PDF

Legacy `.doc` files and image-only scanned PDFs are rejected with clear messages.

### Document Upload Safety

* Unique Supabase Storage paths prevent duplicate-filename conflicts
* Filenames are sanitized safely
* Files with spaces and parentheses are supported
* Maximum upload size: 20 MB
* Partial uploads are cleaned up after failures
* Sensitive credentials are not exposed in browser errors

---

## Technology Stack

### Main Application

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* Gemini API
* Supabase Authentication
* Supabase PostgreSQL
* Supabase Storage
* Vercel

### Testing and Quality

* Vitest
* React Testing Library
* ESLint
* TypeScript validation
* V8 coverage reports
* Playwright browser tests

### Supplementary Django Backend

* Python
* Django
* Pylint
* Django TestCase

The Django backend is included as a supplementary API for internship code-quality and testing requirements. The primary NovaGen application continues to use Next.js, Supabase, and Gemini AI.

---

## Application Flow

```text
User logs in
→ Starts or opens a chat
→ Sends a normal AI question
→ Uploads a document using the paperclip icon
→ Document is uploaded to Supabase Storage
→ Text is extracted and split into chunks
→ Gemini embeddings are generated
→ Indexed chunks are stored in Supabase
→ User asks a question about the document
→ Relevant chunks are retrieved
→ Gemini generates a grounded answer
```

---

## Main Project Structure

```text
novagen/
├── app/                       # Next.js pages and API routes
├── components/                # React UI components
├── lib/                       # Gemini, Supabase, parsing and RAG utilities
├── tests/                     # Automated frontend and API tests
├── supabase/                  # Database schema and migration files
├── django_backend/            # Supplementary Django API
├── middleware.ts              # Route protection
├── package.json
└── README.md
```

---

## Quality Results

### Main Next.js Application

| Check                 |                            Result |
| --------------------- | --------------------------------: |
| ESLint                | Passed with no warnings or errors |
| TypeScript validation |                            Passed |
| Automated tests       |                        168 passed |
| Test files            |                         19 passed |
| Statement coverage    |                            85.90% |
| Branch coverage       |                            83.12% |
| Function coverage     |                            75.00% |
| Line coverage         |                            85.90% |
| Production build      |                            Passed |

### Supplementary Django Backend

| Check                   |       Result |
| ----------------------- | -----------: |
| Django automated tests  |    21 passed |
| Pylint score            |      9.95/10 |
| Internship target       | Above 8.0/10 |
| Health API              |      Working |
| Document validation API |      Working |

---

## Run the Main NovaGen Application Locally

### 1. Clone the repository

```bash
git clone https://github.com/genie-sharon/novagen-ai.git
cd novagen-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env.local`

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

Add your own values locally.

Do not commit `.env.local` to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Run the Main Application Checks

```bash
npm run lint
npm run test:typecheck
npm run test:all
npm run test:coverage
npm run build
```

---

## Run the Supplementary Django Backend

### Windows PowerShell

```powershell
cd django_backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py test
python -m pylint --load-plugins=pylint_django --django-settings-module=config.settings core config manage.py
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

Useful endpoints:

```text
GET  /api/health/
GET  /api/document-types/
POST /api/validate-document/
```

---

## Security Notes

* API keys are stored only in environment variables.
* `.env.local` is excluded from Git.
* Supabase Storage uses unique document paths.
* Gemini errors are sanitized before being shown in the browser.
* Uploaded files, database rows, and user credentials remain inside Supabase.
* Secret keys must never be pasted into GitHub files.

---

## Deployment

NovaGen is deployed using Vercel.

Each push to the `main` branch automatically triggers a new Vercel deployment.

Live link:

https://novagen-ai-sigma.vercel.app

---

## Author

**R. Genie Sharon**
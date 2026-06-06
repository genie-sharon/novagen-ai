-- ============================================
-- NovaGen Database Schema
-- Run this in the Supabase SQL editor
-- ============================================

-- 1. Threads table
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for threads
CREATE POLICY "Users can view their own threads"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- 5. RLS policies for messages
CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their threads"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their threads"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = messages.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- 6. Function + trigger to auto-update threads.updated_at
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_timestamp();

-- ============================================
-- Document Uploads & Vector Search
-- ============================================

-- 7. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 8. Documents table (one per uploaded file)
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id     UUID REFERENCES threads(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  size          BIGINT,
  type          TEXT,
  storage_path  TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 9. Chunks table (split text with embeddings)
CREATE TABLE document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID REFERENCES documents(id) ON DELETE CASCADE,
  thread_id    UUID REFERENCES threads(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    vector(1536),
  chunk_index  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 10. RLS on new tables
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_owner" ON documents
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "chunks_owner" ON document_chunks
  FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

-- 11. Vector similarity search function
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_thread_id UUID,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  document_id UUID,
  similarity  FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.content,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.thread_id = match_thread_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 12. Storage RLS policy (run in Supabase Storage policies tab)
-- Policy name: "Users can access their own files"
-- Allowed operations: SELECT, INSERT, DELETE
-- Policy definition:
--   (storage.foldername(name))[1] = auth.uid()::text
--
--   This ensures users can only read/write files under the folder
--   matching their own user ID (e.g. /<user_id>/<filename>).
--
-- Bucket config (set in Supabase dashboard):
--   Name: documents
--   Public: false
--   Max file size: 20971520 (20 MB)
--   Allowed MIME types: application/pdf, text/plain, text/csv,
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document

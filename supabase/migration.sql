-- ============================================
-- Migration: Update vector dimensions to 1536
-- ============================================
-- Run this in the Supabase SQL editor.
-- Changes embedding column from vector(768) to vector(1536)
-- to match Gemini embedding-001 with outputDimensionality=1536.

-- 1. Drop old match_chunks function (depends on vector type signature)
DROP FUNCTION IF EXISTS match_chunks;

-- 2. Change vector dimension.
--    TRUNCATE removes existing rows so ALTER TYPE succeeds.
--    If the table already has data you need, DELETE it first.
TRUNCATE document_chunks;
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(1536);

-- 3. Recreate match_chunks with correct dimension
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

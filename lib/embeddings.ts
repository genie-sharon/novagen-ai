import { embed, embedMany } from "ai";
import { google } from "@/lib/gemini";

const EMBEDDING_DIMENSIONS = 1536;

function normalizeEmbedding(values: number[]): number[] {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0)
  );

  if (!magnitude) {
    throw new Error("Embedding magnitude is zero");
  }

  return values.map((value) => value / magnitude);
}

function validateEmbedding(values: number[]): number[] {
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding size: expected ${EMBEDDING_DIMENSIONS}, received ${values.length}`
    );
  }

  return normalizeEmbedding(values);
}

export async function generateDocumentEmbeddings(
  chunks: string[]
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: google.embedding("gemini-embedding-001"),
    values: chunks,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      },
    },
  });

  return embeddings.map(validateEmbedding);
}

export async function generateQuestionEmbedding(
  question: string
): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embedding("gemini-embedding-001"),
    value: question,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "QUESTION_ANSWERING",
      },
    },
  });

  return validateEmbedding(embedding);
}

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gemini", () => ({
  google: {
    embedding: vi.fn(() => ({
      embed: vi.fn(),
      embedMany: vi.fn(),
    })),
  },
}));

vi.mock("ai", () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}));

import { embed, embedMany } from "ai";
import {
  generateDocumentEmbeddings,
  generateQuestionEmbedding,
} from "@/lib/embeddings";

const EMBEDDING_DIMENSIONS = 1536;

function makeMockEmbedding(): number[] {
  return Array.from({ length: EMBEDDING_DIMENSIONS }, () => Math.random() * 2 - 1);
}

describe("generateDocumentEmbeddings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates embeddings for document chunks", async () => {
    const mockEmbedding = makeMockEmbedding();
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [mockEmbedding],
      warnings: [],
      responses: undefined,
    });

    const result = await generateDocumentEmbeddings(["NovaGen is great"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(vi.mocked(embedMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ["NovaGen is great"],
      })
    );
  });

  it("uses document-retrieval task configuration", async () => {
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [makeMockEmbedding()],
      warnings: [],
      responses: undefined,
    });

    await generateDocumentEmbeddings(["test"]);
    expect(vi.mocked(embedMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          google: expect.objectContaining({
            taskType: "RETRIEVAL_DOCUMENT",
          }),
        },
      })
    );
  });

  it("output vectors contain exactly 1536 values", async () => {
    const embedding = makeMockEmbedding();
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [embedding],
      warnings: [],
      responses: undefined,
    });

    const result = await generateDocumentEmbeddings(["test"]);
    expect(result[0].length).toBe(EMBEDDING_DIMENSIONS);
  });

  it("normalizes embedding vectors", async () => {
    const raw = [3, 0, 0, ...Array(EMBEDDING_DIMENSIONS - 3).fill(0)];
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [raw],
      warnings: [],
      responses: undefined,
    });

    const result = await generateDocumentEmbeddings(["test"]);
    const magnitude = Math.sqrt(
      result[0].reduce((sum, v) => sum + v * v, 0)
    );
    expect(magnitude).toBeCloseTo(1, 5);
  });

  it("rejects zero-magnitude embeddings", async () => {
    const zeroEmbedding = Array(EMBEDDING_DIMENSIONS).fill(0);
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [zeroEmbedding],
      warnings: [],
      responses: undefined,
    });

    await expect(generateDocumentEmbeddings(["test"])).rejects.toThrow(
      "magnitude is zero"
    );
  });

  it("rejects invalid-dimension embeddings", async () => {
    const wrongDim = Array(100).fill(0.5);
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [wrongDim],
      warnings: [],
      responses: undefined,
    });

    await expect(generateDocumentEmbeddings(["test"])).rejects.toThrow(
      "Invalid embedding size"
    );
  });

  it("surfaces API errors safely", async () => {
    vi.mocked(embedMany).mockRejectedValue(new Error("API quota exceeded"));

    await expect(
      generateDocumentEmbeddings(["test"])
    ).rejects.toThrow("API quota exceeded");
  });
});

describe("generateQuestionEmbedding", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a query embedding", async () => {
    const mockEmbedding = makeMockEmbedding();
    vi.mocked(embed).mockResolvedValue({
      embedding: mockEmbedding,
      usage: undefined,
      responses: undefined,
      warnings: [],
    });

    const result = await generateQuestionEmbedding("What is NovaGen?");
    expect(result).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("uses question-answering task configuration", async () => {
    vi.mocked(embed).mockResolvedValue({
      embedding: makeMockEmbedding(),
      usage: undefined,
      responses: undefined,
      warnings: [],
    });

    await generateQuestionEmbedding("test question");
    expect(vi.mocked(embed)).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          google: expect.objectContaining({
            taskType: "QUESTION_ANSWERING",
          }),
        },
      })
    );
  });

  it("normalizes query embedding", async () => {
    const raw = [4, 0, 0, ...Array(EMBEDDING_DIMENSIONS - 3).fill(0)];
    vi.mocked(embed).mockResolvedValue({
      embedding: raw,
      usage: undefined,
      responses: undefined,
      warnings: [],
    });

    const result = await generateQuestionEmbedding("q");
    const magnitude = Math.sqrt(
      result.reduce((sum, v) => sum + v * v, 0)
    );
    expect(magnitude).toBeCloseTo(1, 5);
  });

  it("rejects zero-magnitude query embedding", async () => {
    vi.mocked(embed).mockResolvedValue({
      embedding: Array(EMBEDDING_DIMENSIONS).fill(0),
      usage: undefined,
      responses: undefined,
      warnings: [],
    });

    await expect(generateQuestionEmbedding("q")).rejects.toThrow(
      "magnitude is zero"
    );
  });
});

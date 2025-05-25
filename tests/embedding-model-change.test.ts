import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { getMetadataValue, setMetadataValue } from "../src/database/metadata";
import { checkEmbeddingModel } from "../src/startup/checkEmbeddingModel";
import { reembedAllDocuments } from "../src/database/reembedding";

// Store original environment variables
const originalEnv = { ...process.env };

describe("Embedding Model Change Detection", () => {
  beforeEach(() => {
    // Reset mocks and restore original environment
    mock.restore();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  test("should detect when embedding model changes", async () => {
    // Create fresh mock for reembedding
    const mockReembedAllDocuments = mock(() => Promise.resolve());

    // Mock the reembedding module
    mock.module("../src/database/reembedding", () => ({
      reembedAllDocuments: mockReembedAllDocuments,
    }));

    // Mock the metadata functions
    mock.module("../src/database/metadata", () => ({
      getMetadataValue: mock((key: string) => {
        if (key === "AI_EMBEDDING_MODEL") return "text-embedding-ada-002";
        if (key === "AI_EMBEDDING_SIZE") return "1536";
        return null;
      }),
      setMetadataValue: mock(() => true),
    }));

    // Set new environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "1536";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was called
    expect(mockReembedAllDocuments).toHaveBeenCalled();
  });

  test("should detect when embedding size changes", async () => {
    // Create fresh mock for reembedding
    const mockReembedAllDocuments = mock(() => Promise.resolve());

    // Mock the reembedding module
    mock.module("../src/database/reembedding", () => ({
      reembedAllDocuments: mockReembedAllDocuments,
    }));

    // Mock the metadata functions
    mock.module("../src/database/metadata", () => ({
      getMetadataValue: mock((key: string) => {
        if (key === "AI_EMBEDDING_MODEL") return "text-embedding-3-small";
        if (key === "AI_EMBEDDING_SIZE") return "1536";
        return null;
      }),
      setMetadataValue: mock(() => true),
    }));

    // Set new environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "3072";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was called
    expect(mockReembedAllDocuments).toHaveBeenCalled();
  });

  test("should not re-embed when there's no change", async () => {
    // Create fresh mock for reembedding
    const mockReembedAllDocuments = mock(() => Promise.resolve());

    // Mock the reembedding module
    mock.module("../src/database/reembedding", () => ({
      reembedAllDocuments: mockReembedAllDocuments,
    }));

    // Mock the metadata functions
    mock.module("../src/database/metadata", () => ({
      getMetadataValue: mock((key: string) => {
        if (key === "AI_EMBEDDING_MODEL") return "text-embedding-3-small";
        if (key === "AI_EMBEDDING_SIZE") return "1536";
        return null;
      }),
      setMetadataValue: mock(() => true),
    }));

    // Set same environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "1536";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was not called
    expect(mockReembedAllDocuments).not.toHaveBeenCalled();
  });
});

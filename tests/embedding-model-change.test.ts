import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { getMetadataValue, setMetadataValue } from "../src/database/metadata";
import { checkEmbeddingModel } from "../src/startup/checkEmbeddingModel";
import { reembedAllDocuments } from "../src/database/reembedding";

// Store original environment variables
const originalEnv = { ...process.env };

// Mock for generateEmbeddings
const mockEmbeddings = Array(1536).fill(0.1);
const generateEmbeddingsMock = mock(async (text, config) => {
  return mockEmbeddings;
});

// Mock the generateEmbeddings module
mock.module("../src/shared/generateEmbeddings", () => {
  return {
    generateEmbeddings: generateEmbeddingsMock,
  };
});

// Helper function to setup mocks for a test
const setupMocks = (storedModel: string, storedSize: string) => {
  // Create fresh mock for reembedding
  const mockReembedAllDocuments = mock(() => Promise.resolve());

  // Mock the reembedding module
  mock.module("../src/database/reembedding", () => ({
    reembedAllDocuments: mockReembedAllDocuments,
  }));

  // Mock the metadata functions
  mock.module("../src/database/metadata", () => ({
    metadataTableExists: mock(() => true), // Simulate existing database
    getMetadataValue: mock((key: string) => {
      if (key === "AI_EMBEDDING_MODEL") return storedModel;
      if (key === "AI_EMBEDDING_SIZE") return storedSize;
      return null;
    }),
    setMetadataValue: mock(() => true),
  }));

  return { mockReembedAllDocuments };
};

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
    const { mockReembedAllDocuments } = setupMocks(
      "text-embedding-ada-002",
      "1536"
    );

    // Set new environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "1536";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was called
    expect(mockReembedAllDocuments).toHaveBeenCalled();
  });

  test("should detect when embedding size changes", async () => {
    const { mockReembedAllDocuments } = setupMocks(
      "text-embedding-3-small",
      "1536"
    );

    // Set new environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "3072";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was called
    expect(mockReembedAllDocuments).toHaveBeenCalled();
  });

  test("should not re-embed when there's no change", async () => {
    const { mockReembedAllDocuments } = setupMocks(
      "text-embedding-3-small",
      "1536"
    );

    // Set same environment variables
    process.env.AI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.AI_EMBEDDING_SIZE = "1536";

    // Run the check
    await checkEmbeddingModel();

    // Verify reembedAllDocuments was not called
    expect(mockReembedAllDocuments).not.toHaveBeenCalled();
  });
});

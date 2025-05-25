import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  mock,
} from "bun:test";
import type Database from "bun:sqlite";
import { setupTestDb, teardownTestDb } from "./helpers/mockDb";

// Set test environment variables
process.env.AI_API_KEY = "test-key";
process.env.AI_EMBEDDING_MODEL = "test-model";

// Mock for generateEmbeddings
const mockEmbeddings = Array(1536).fill(0.1);
const generateEmbeddingsMock = mock(async (text, config) => {
  // Return mock embeddings
  return mockEmbeddings;
});

// Mock the generateEmbeddings module
mock.module("../src/shared/generateEmbeddings", () => {
  return {
    generateEmbeddings: generateEmbeddingsMock,
  };
});

describe("Document Route", () => {
  // Set up the test environment and insert test document
  let documentId: number;
  let db: Database;

  beforeAll(async () => {
    // Create a fresh test database and set it up as global
    db = setupTestDb();
  });

  beforeEach(async () => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");

    // Insert a test document directly into the database
    const sampleText = "This is a test document for document endpoint";
    const sampleSource = "test-source";
    const sampleMetadata = JSON.stringify({ testKey: "testValue" });
    const embeddingsStr = `[${mockEmbeddings.join(",")}]`;
    
    db.query(`
      INSERT INTO documents (text, metadata, embeddings, source)
      VALUES (?, ?, ?, ?)
    `).run(sampleText, sampleMetadata, embeddingsStr, sampleSource);
    
    // Get the document id
    const document = db.query("SELECT id FROM documents LIMIT 1").get() as { id: number } | null;
    documentId = document?.id || 0;
  });

  // Close the database after all tests
  afterAll(() => {
    // Properly clean up test database
    teardownTestDb(db);
  });

  test("should retrieve document by id", async () => {
    // Skip test if document wasn't created successfully
    if (!documentId) {
      console.warn("Skipping test: document not created successfully");
      return;
    }
    
    // Import the document function - importing every time to ensure we get fresh instance
    const docImport = await import("../src/routes/document/document");
    
    // Get document by ID using the handler function directly
    const result = await docImport.document({ id: documentId });
    
    // Verify document properties
    expect(result).toHaveProperty("document");
    const doc = result.document;
    expect(doc).toHaveProperty("id", documentId);
    expect(doc).toHaveProperty("text", "This is a test document for document endpoint");
    expect(doc).toHaveProperty("source", "test-source");
    expect(doc).toHaveProperty("metadata");
    expect(doc.metadata).toHaveProperty("testKey", "testValue");
  });

  test("should handle non-existent document id", async () => {
    // Import the document function - importing every time to ensure we get fresh instance
    const docImport = await import("../src/routes/document/document");
    
    const result = await docImport.document({ id: 9999 });
    
    // Verify error response
    expect(result).toHaveProperty("error", "Document not found");
    expect(result).not.toHaveProperty("document");
  });

  test("should handle validation errors", async () => {
    // Create request with missing ID
    const request = new Request("http://localhost/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    
    // Import the route handler - importing every time to ensure we get fresh instance
    const docImport = await import("../src/routes/document/document");
    
    // Process the request
    const response = await docImport.documentRoute(request);
    const responseData = await response.json();
    
    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Validation failed");
    expect(responseData).toHaveProperty("issues");
  });
});

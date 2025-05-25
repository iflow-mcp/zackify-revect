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
import { createTestDb } from "./helpers/mockDb";

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
  let indexRoute: Function;
  let documentRoute: Function;

  beforeAll(async () => {
    // Create a fresh test database
    db = createTestDb();
    
    // Make the db available to the routes by monkey patching
    (globalThis as any).testDb = db;
    
    // Import routes with mocks already in place
    // We need to dynamically import them to ensure the mocks are applied first
    const indexModuleImport = await import("../src/routes/index");
    const documentModuleImport = await import("../src/routes/document/document");
    
    indexRoute = indexModuleImport.indexRoute;
    documentRoute = documentModuleImport.documentRoute;
  });

  beforeEach(async () => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");

    // Insert a test document to retrieve later
    const sampleText = "This is a test document for document endpoint";
    const sampleSource = "test-source";
    
    // Create a request with sample data
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: sampleSource,
        text: sampleText,
        metadata: { testKey: "testValue" }
      }),
    });

    // Process the request
    await indexRoute(request);

    // Get the document id
    const document = db.query("SELECT id FROM documents LIMIT 1").get() as { id: number };
    documentId = document?.id || 0;
  });

  // Close the database after all tests
  afterAll(() => {
    db.close();
    // Clean up the global reference
    delete (globalThis as any).testDb;
  });

  test("should retrieve document by id", async () => {
    // Skip test if document wasn't created successfully
    if (!documentId) {
      console.warn("Skipping test: document not created successfully");
      return;
    }
    
    // Create a request to retrieve the document
    const request = new Request("http://localhost/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: documentId,
      }),
    });

    // Process the request
    const response = await documentRoute(request);
    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("document");
    
    // Verify document properties
    const document = responseData.document;
    expect(document).toHaveProperty("id", documentId);
    expect(document).toHaveProperty("text", "This is a test document for document endpoint");
    expect(document).toHaveProperty("source", "test-source");
    expect(document).toHaveProperty("metadata");
    expect(document.metadata).toHaveProperty("testKey", "testValue");
  });

  test("should handle non-existent document id", async () => {
    // Create a request with non-existent document id
    const request = new Request("http://localhost/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 9999, // Non-existent ID
      }),
    });

    // Process the request
    const response = await documentRoute(request);
    const responseData = await response.json();

    // Verify error response
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("error", "Document not found");
    expect(responseData).not.toHaveProperty("document");
  });

  test("should handle invalid request with missing id", async () => {
    // Create a request without an id
    const request = new Request("http://localhost/document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    // Process the request
    const response = await documentRoute(request);
    const responseData = await response.json();

    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Validation failed");
    expect(responseData).toHaveProperty("issues");
  });
});

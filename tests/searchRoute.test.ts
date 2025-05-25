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

describe("Search Route", () => {
  // Set up the test environment
  let db: Database;
  let indexRoute: Function;
  let searchRoute: Function;

  beforeAll(async () => {
    // Create a fresh test database
    db = createTestDb();
    
    // Make the db available to the routes by monkey patching
    (globalThis as any).testDb = db;
    
    // Import routes after mocking and setting up the test db
    const indexModuleImport = await import("../src/routes/index");
    const searchModuleImport = await import("../src/routes/search/search");
    
    indexRoute = indexModuleImport.indexRoute;
    searchRoute = searchModuleImport.searchRoute;
  });

  // Set up test data for each test
  beforeEach(async () => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");

    // Index test documents with different content
    const testDocs = [
      { source: "test-source-1", text: "Artificial intelligence is revolutionizing technology" },
      { source: "test-source-2", text: "Machine learning models can process large amounts of data" },
      { source: "test-source-3", text: "Natural language processing helps computers understand human language" }
    ];

    // Index each test document
    for (const doc of testDocs) {
      const request = new Request("http://localhost/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doc),
      });
      await indexRoute(request);
    }
  });

  // Close the database after all tests
  afterAll(() => {
    db.close();
    // Clean up the global reference
    delete (globalThis as any).testDb;
  });

  test("should search for indexed documents and return results from SQLite", async () => {
    // Create a search request
    const request = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "intelligence",
      }),
    });

    // Process the search request
    const response = await searchRoute(request);
    const responseData = await response.json();

    // Verify we get results back
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("results");
    expect(Array.isArray(responseData.results)).toBe(true);
    expect(responseData.results.length).toBeGreaterThan(0);

    // Verify the results have the expected properties
    const firstResult = responseData.results[0];
    expect(firstResult).toHaveProperty("id");
    expect(firstResult).toHaveProperty("text");
    expect(firstResult).toHaveProperty("source");
    expect(firstResult).toHaveProperty("distance");
    expect(firstResult).toHaveProperty("metadata");
    expect(firstResult).toHaveProperty("document_id");

    // Verify that results are sorted by distance
    if (responseData.results.length > 1) {
      expect(responseData.results[0].distance).toBeLessThanOrEqual(responseData.results[1].distance);
    }
  });

  test("should handle a search with no matching results", async () => {
    // Since our mock returns the same embeddings for all searches,
    // this test is more about validating the response structure
    // than actually getting zero results
    const request = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "xylophone123nonexistentterm",
      }),
    });

    // Process the search request
    const response = await searchRoute(request);
    const responseData = await response.json();

    // Verify we get a results array (may not be empty with our mock)
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("results");
    expect(Array.isArray(responseData.results)).toBe(true);
  });

  test("should handle validation errors for missing text", async () => {
    // Create a search request with missing text field
    const request = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    // Process the search request
    const response = await searchRoute(request);
    const responseData = await response.json();

    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Validation failed");
    expect(responseData).toHaveProperty("issues");
  });

  test("should use SQLite for vector similarity search", async () => {
    // Create a new search request
    const request = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "machine learning",
      }),
    });
    
    // Process the search request
    const response = await searchRoute(request);
    const responseData = await response.json();
    
    // Verify that SQLite was used by checking we got valid results
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("results");
    expect(Array.isArray(responseData.results)).toBe(true);
    
    // Check that database contains embeddings in the documents table
    const docs = db.query("SELECT embeddings FROM documents LIMIT 1").get();
    expect(docs).not.toBeNull();
    if (docs) {
      expect(docs).toHaveProperty("embeddings");
      expect((docs as {embeddings: string}).embeddings).toContain("[");  // Check it has array format
    }
    
    // Verify that the search operation used the generateEmbeddings function
    expect(generateEmbeddingsMock.mock.calls.length).toBeGreaterThan(0);
  });
});

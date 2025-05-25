import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  mock,
} from "bun:test";

// We need to set environment variables before importing the database module
process.env.DATABASE_PATH = ":memory:";
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

// Import the indexRoute after mocking
import { indexRoute } from "../src/routes/index";

// Now we can import database and migrations
import { db } from "../src/database/database";
import { migrations } from "../src/database/migrations";

describe("Index Route", () => {
  // Set up the test environment
  beforeAll(() => {
    // Create migrations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Run the migrations to create database schema
    for (const migration of migrations) {
      migration.up();
    }
  });

  // Clean up before each test
  beforeEach(() => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");
  });

  // Close the database after all tests
  afterAll(() => {
    db.close();
  });

  test("should index document and call generateEmbeddings with correct parameters", async () => {
    const sampleText = "This is a test document for indexing";
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
      }),
    });

    // Process the request
    const response = await indexRoute(request);
    const responseData = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty("message", "Data successfully indexed");

    // Verify that generateEmbeddings was called with the correct text
    expect(generateEmbeddingsMock.mock.calls.length).toBeGreaterThan(0);
    const callArgs = generateEmbeddingsMock.mock.calls[0];
    if (callArgs) {
      expect(callArgs[0]).toBe(sampleText);
      
      // Verify that the config was passed correctly
      expect(callArgs[1]).toEqual({
        apiKey: "test-key",
        baseURL: undefined,
      });
    } else {
      throw new Error("Expected generateEmbeddingsMock to be called");
    }

    // Check that the document was stored in the database
    const documentCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(documentCount.count).toBe(1);

    // Check that the document has the correct source and text
    const document = db
      .query("SELECT source, text FROM documents LIMIT 1")
      .get() as { source: string; text: string };
    expect(document.source).toBe(sampleSource);
    expect(document.text).toBe(sampleText);
  });
});
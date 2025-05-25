import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
} from "bun:test";
import { indexRoute } from "../src/routes/index";
import { searchRoute } from "../src/routes/search/search";

// We need to set environment variables before importing the database module
process.env.DATABASE_PATH = ":memory:";
process.env.AI_API_KEY = "test-key";
process.env.AI_EMBEDDING_MODEL = "test-model";

// We need to mock OpenAI before importing modules that use it
import { mock } from "bun:test";

// Mock OpenAI
mock.module("openai", () => {
  return {
    default: class OpenAI {
      constructor() {}

      embeddings = {
        create: () => {
          return {
            data: [
              {
                embedding: Array(1536).fill(0.1),
              },
            ],
          };
        },
      };
    },
  };
});

// Now we can import database and migrations
import { db } from "../src/database/database";
import { migrations } from "../src/database/migrations";

// Test short and long texts to ensure correct chunking behavior
const shortText = "This is a short text that should not be split into chunks.";
const longText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis, 
orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus, 
non vestibulum ligula dapibus. Aenean eget erat. Phasellus sed leo quis metus sollicitudin consequat. 
Sed imperdiet eros at diam cursus, sed volutpat nibh accumsan. Integer vel tincidunt nisl, id interdum nisi.
Nulla facilisi. Cras eu dolor a neque lacinia tincidunt vel vitae mi. Pellentesque habitant morbi tristique.
`;

describe("Index and Search routes", () => {
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

  test("should store short text as a single document without chunks", async () => {
    // Create a request with short text
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test",
        text: shortText,
      }),
    });

    // Process the request
    await indexRoute(request);

    // Check documents table - should have one entry
    const documentCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(documentCount.count).toBe(1);

    // Check document_chunks table - should have no entries as text is short
    const chunkCount = db
      .query("SELECT COUNT(*) as count FROM document_chunks")
      .get() as { count: number };
    expect(chunkCount.count).toBe(0);
  });

  test("should store long text as a document with multiple chunks", async () => {
    // Create a request with long text
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test",
        text: longText,
      }),
    });

    // Process the request
    await indexRoute(request);

    // Check documents table - should have one entry
    const documentCount = db
      .query("SELECT COUNT(*) as count FROM documents")
      .get() as { count: number };
    expect(documentCount.count).toBe(1);

    // Check document_chunks table - should have multiple entries as text is long
    const chunkCount = db
      .query("SELECT COUNT(*) as count FROM document_chunks")
      .get() as { count: number };
    expect(chunkCount.count).toBeGreaterThan(1);

    // Get the document
    const document = db.query("SELECT * FROM documents LIMIT 1").get() as {
      id: number;
      text: string;
    };

    // Get all chunks for this document
    const chunks = db
      .query("SELECT * FROM document_chunks WHERE document_id = ?")
      .all(document.id) as { text: string }[];

    // Join all chunks and ensure they cover the entire text (ignoring whitespace)
    const normalizeText = (text: string) => text.replace(/\s+/g, "");
    const originalText = normalizeText(longText);
    const chunksText = normalizeText(chunks.map(chunk => chunk.text).join(" "));

    // Verify that all content is preserved
    expect(chunksText).toBe(originalText);
  });

  test("should be able to search for indexed documents", async () => {
    // First, index a document
    const indexRequest = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test",
        text: shortText,
      }),
    });

    await indexRoute(indexRequest);

    // Now search for the document
    const searchRequest = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "chunks",
      }),
    });

    const response = await searchRoute(searchRequest);
    const responseData = await response.json();

    // Verify we get results back
    expect(response.status).toBe(200);
    expect(responseData.results).toBeDefined();
    expect(Array.isArray(responseData.results)).toBe(true);
    expect(responseData.results.length).toBeGreaterThan(0);

    // Verify the first result has the expected properties
    const firstResult = responseData.results[0];
    expect(firstResult).toHaveProperty("id");
    expect(firstResult).toHaveProperty("text");
    expect(firstResult).toHaveProperty("source");
    expect(firstResult).toHaveProperty("distance");
    expect(firstResult).toHaveProperty("metadata");

    // The text should match what we indexed
    expect(firstResult.text).toBe(shortText);
    expect(firstResult.source).toBe("test");
  });
});

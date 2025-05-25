import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  mock,
  spyOn,
} from "bun:test";
import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { createDocumentsTableSQL, createDocumentChunksTableSQL } from "../src/database/migrations";

// Set test environment variables
process.env.DATABASE_PATH = "******"; // In-memory database for tests
process.env.AI_API_KEY = "test-key";
process.env.AI_EMBEDDING_MODEL = "test-model";

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

describe("Index and Search routes", () => {
  let db: Database;

  beforeAll(async () => {
    // Create fresh database
    db = new Database("******");
    
    // Configure database
    db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(db);
    db.exec(createDocumentsTableSQL("1536"));
    db.exec(createDocumentChunksTableSQL("1536"));
    
    // Spy on database module to return our test db
    mock.module("../src/database/database", () => ({
      db: db,
      getDb: () => db
    }));
  });

  beforeEach(async () => {
    // Clean up test data
    db.exec("DELETE FROM document_chunks");
    db.exec("DELETE FROM documents");
  });

  afterAll(() => {
    db.close();
  });

  test("should store short text as a single document with one chunk", async () => {
    // Import the module
    const { indexRoute } = await import("../src/routes/index/index");
    
    const shortText = "This is a short test document.";
    
    // Create a request for indexing
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: shortText,
      }),
    });

    // Process the index request
    const response = await indexRoute(request);
    expect(response.status).toBe(200);

    // Check that one document was stored
    const docCount = db.query("SELECT COUNT(*) as count FROM documents").get() as { count: number };
    expect(docCount.count).toBe(1);

    // For short text, we should have just one chunk
    const chunkCount = db.query("SELECT COUNT(*) as count FROM document_chunks").get() as { count: number };
    expect(chunkCount.count).toBe(1);
  });

  test("should store long text as a document with multiple chunks", async () => {
    // Import the module
    const { indexRoute } = await import("../src/routes/index/index");
    
    // Create a long text that will be split into multiple chunks
    const longText = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia, nunc eu tincidunt lobortis, 
      orci massa accumsan lectus, vel varius metus neque ut enim. Donec ullamcorper risus id enim faucibus, 
      non vestibulum ligula dapibus. Aenean eget erat. Phasellus sed leo quis metus sollicitudin consequat. 
      Sed imperdiet eros at diam cursus, sed volutpat nibh accumsan. Integer vel tincidunt nisl, id interdum nisi. 
      Nulla facilisi. Cras eu dolor a neque lacinia tincidunt vel vitae mi. Pellentesque habitant morbi tristique.
      Senectus et netus et malesuada fames ac turpis egestas. Curabitur at nunc sed risus pellentesque vestibulum. 
      Fusce eget metus quis magna mollis rhoncus. Pellentesque habitant morbi tristique senectus et netus et 
      malesuada fames ac turpis egestas. Proin at semper libero. Nullam non sollicitudin risus.
    `;
    
    // Create a request for indexing
    const request = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: longText,
      }),
    });

    // Process the index request
    const response = await indexRoute(request);
    expect(response.status).toBe(200);

    // Check that one document was stored
    const docCount = db.query("SELECT COUNT(*) as count FROM documents").get() as { count: number };
    expect(docCount.count).toBe(1);

    // For long text, we should have multiple chunks
    const chunkCount = db.query("SELECT COUNT(*) as count FROM document_chunks").get() as { count: number };
    expect(chunkCount.count).toBeGreaterThan(1);
  });

  test("should be able to search for indexed documents", async () => {
    // Import modules
    const { indexRoute } = await import("../src/routes/index/index");
    const { searchRoute } = await import("../src/routes/search/search");
    
    // First, index a document
    const text = "Here is some text about artificial intelligence and machine learning";
    
    // Create a request for indexing
    const indexRequest = new Request("http://localhost/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "test-source",
        text: text,
      }),
    });

    // Process the index request
    await indexRoute(indexRequest);
    
    // Now search for it
    const searchRequest = new Request("http://localhost/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "artificial intelligence",
      }),
    });
    
    // Process the search request
    const searchResponse = await searchRoute(searchRequest);
    const searchData = await searchResponse.json();
    
    // Verify search results
    expect(searchResponse.status).toBe(200);
    expect(searchData.results).toBeDefined();
    
    // Since our mock always returns the same embeddings, any search will match
    expect(searchData.results.length).toBeGreaterThan(0);
    
    // Check the first result
    if (searchData.results.length > 0) {
      const result = searchData.results[0];
      expect(result.text).toBeDefined();
      expect(result.source).toBe("test-source");
    }
  });
});

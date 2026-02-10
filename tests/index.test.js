import { expect, describe, test, beforeAll, beforeEach, afterAll, mock, } from "bun:test";
import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { createDocumentsTableSQL, createDocumentChunksTableSQL, } from "../src/database/migrations";
import { indexRoute } from "../src/routes/index/index";
import { createMockRequest, createMockResponse, createMockNext } from "./helpers/mockExpress";
// Set test environment variables
process.env.DATABASE_PATH = ":memory:"; // In-memory database for tests
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
    let db;
    beforeAll(async () => {
        // Create fresh database
        db = new Database(":memory:");
        // Configure database
        db.exec("PRAGMA journal_mode = WAL;");
        sqliteVec.load(db);
        db.exec(createDocumentsTableSQL("1536"));
        db.exec(createDocumentChunksTableSQL("1536"));
        // Create metadata table
        db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Spy on database module to return our test db
        mock.module("../src/database/database", () => ({
            db: db
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
        // Create a request for indexing
        const req = createMockRequest({
            body: {
                source: "test-source",
                text: "This is a short test document.",
            },
        });
        const res = createMockResponse();
        const next = createMockNext();
        // Process the index request
        await indexRoute(req, res, next);
        expect(res._status).toBe(200);
        // Check that one document was stored
        const docCount = db
            .query("SELECT COUNT(*) as count FROM documents")
            .get();
        expect(docCount.count).toBe(1);
        // For short text, we should have just one chunk
        const chunkCount = db
            .query("SELECT COUNT(*) as count FROM document_chunks")
            .get();
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
        const req = createMockRequest({
            body: {
                source: "test-source",
                text: longText,
            },
        });
        const res = createMockResponse();
        const next = createMockNext();
        // Process the index request
        await indexRoute(req, res, next);
        expect(res._status).toBe(200);
        // Check that one document was stored
        const docCount = db
            .query("SELECT COUNT(*) as count FROM documents")
            .get();
        expect(docCount.count).toBe(1);
        // For long text, we should have multiple chunks
        const chunkCount = db
            .query("SELECT COUNT(*) as count FROM document_chunks")
            .get();
        expect(chunkCount.count).toBeGreaterThan(1);
    });
    test("should be able to search for indexed documents", async () => {
        // Import modules
        const { indexRoute } = await import("../src/routes/index/index");
        const { searchRoute } = await import("../src/routes/search/search");
        // First, index a document
        const text = "Here is some text about artificial intelligence and machine learning";
        // Create a request for indexing
        const indexReq = createMockRequest({
            body: {
                source: "test-source",
                text: text,
            },
        });
        const indexRes = createMockResponse();
        const indexNext = createMockNext();
        // Process the index request
        await indexRoute(indexReq, indexRes, indexNext);
        // Now search for it
        const searchReq = createMockRequest({
            body: {
                text: "artificial intelligence",
            },
        });
        const searchRes = createMockResponse();
        const searchNext = createMockNext();
        // Process the search request
        await searchRoute(searchReq, searchRes, searchNext);
        // Verify search results
        expect(searchRes._status).toBe(200);
        expect(searchRes._json.results).toBeDefined();
        // Since our mock always returns the same embeddings, any search will match
        expect(searchRes._json.results.length).toBeGreaterThan(0);
        // Check the first result
        if (searchRes._json.results.length > 0) {
            const result = searchRes._json.results[0];
            expect(result.text).toBeDefined();
            expect(result.source).toBe("test-source");
        }
    });
    test("should require source parameter when indexing documents", async () => {
        // Create a request without a source parameter
        const req = createMockRequest({
            body: {
                // No source provided
                text: "This is a short test document.",
            },
        });
        const res = createMockResponse();
        const next = createMockNext();
        // Process the request
        await indexRoute(req, res, next);
        // Verify we get an error response
        expect(res._status).toBe(400);
        expect(res._json.error).toBeDefined();
    });
    test("should correctly set timestamps when indexing documents", async () => {
        // Create a request
        const req = createMockRequest({
            body: {
                source: "test",
                text: "This is a short test document.",
            },
        });
        const res = createMockResponse();
        const next = createMockNext();
        // Process the request
        await indexRoute(req, res, next);
        // Check if document has a timestamp
        const document = db
            .query("SELECT created_at FROM documents ORDER BY id DESC LIMIT 1")
            .get();
        expect(document).toBeDefined();
        expect(document.created_at).toBeDefined();
        expect(new Date(document.created_at).getTime()).not.toBeNaN(); // Valid date
        // Check if document chunk has a timestamp
        const chunk = db
            .query("SELECT created_at FROM document_chunks ORDER BY id DESC LIMIT 1")
            .get();
        expect(chunk).toBeDefined();
        expect(chunk.created_at).toBeDefined();
        expect(new Date(chunk.created_at).getTime()).not.toBeNaN(); // Valid date
    });
});

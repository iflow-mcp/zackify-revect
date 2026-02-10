import { expect, describe, test, beforeAll, beforeEach, afterAll, mock, } from "bun:test";
import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { createDocumentsTableSQL, createDocumentChunksTableSQL } from "../src/database/migrations";
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
describe("Index Route", () => {
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
    beforeEach(() => {
        // Reset mock calls
        generateEmbeddingsMock.mockClear?.();
        // Clean up test data
        db.exec("DELETE FROM document_chunks");
        db.exec("DELETE FROM documents");
    });
    afterAll(() => {
        db.close();
    });
    test("should index document and call generateEmbeddings with correct parameters", async () => {
        const sampleText = "This is a test document for indexing";
        const sampleSource = "test-source";
        // Import the index route handler
        const { indexRoute } = await import("../src/routes/index/index");
        // Create a request with sample data
        const req = createMockRequest({
            body: {
                source: sampleSource,
                text: sampleText,
            },
        });
        const res = createMockResponse();
        const next = createMockNext();
        // Process the request
        await indexRoute(req, res, next);
        // Verify response
        expect(res._status).toBe(200);
        expect(res._json).toHaveProperty("message", "Data successfully indexed");
        // Verify that generateEmbeddings was called with the correct text
        expect(generateEmbeddingsMock.mock.calls.length).toBeGreaterThan(0);
        const callArgs = generateEmbeddingsMock.mock.calls[0];
        if (callArgs) {
            expect(callArgs[0]).toBe(sampleText);
            // Verify that the config was passed correctly
            expect(callArgs[1]).toEqual({
                apiKey: "test-key",
                baseURL: process.env.AI_BASE_URL,
            });
        }
        // Check that the document was stored in the database
        const documentCount = db
            .query("SELECT COUNT(*) as count FROM documents")
            .get();
        expect(documentCount.count).toBe(1);
        // Check that the document has the correct source and text
        const document = db
            .query("SELECT source, text FROM documents LIMIT 1")
            .get();
        expect(document.source).toBe(sampleSource);
        expect(document.text).toBe(sampleText);
    });
});

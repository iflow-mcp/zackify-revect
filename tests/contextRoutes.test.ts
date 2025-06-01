import {
  expect,
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  mock,
} from "bun:test";
import Database from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { createDocumentsTableSQL } from "../src/database/migrations";
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

describe("Context Routes", () => {
  let db: Database;

  beforeAll(async () => {
    // Create fresh database
    db = new Database(":memory:");
    
    // Configure database
    db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(db);
    db.exec(createDocumentsTableSQL("1536"));
    
    // Spy on database module to return our test db
    mock.module("../src/database/database", () => ({
      db: db
    }));
  });

  beforeEach(() => {
    // Reset mock calls
    generateEmbeddingsMock.mockClear?.();
    
    // Clean up test data
    db.exec("DELETE FROM documents WHERE source = 'context'");
  });

  afterAll(() => {
    db.close();
  });

  test("should set and get context with key", async () => {
    // Import the context routes
    const { setContextRoute } = await import("../src/routes/context/setContext");
    const { getContextRoute } = await import("../src/routes/context/getContext");
    
    const testKey = "test-key";
    const testMessage = "This is a test context message";
    
    // Set context
    const setReq = createMockRequest({
      body: {
        key: testKey,
        message: testMessage,
      },
    });
    const setRes = createMockResponse();
    const setNext = createMockNext();

    await setContextRoute(setReq, setRes, setNext);

    // Verify set response
    expect((setRes as any)._status).toBe(200);
    expect((setRes as any)._json).toHaveProperty("message", "Context successfully set");

    // Get context
    const getReq = createMockRequest({
      body: {
        key: testKey,
      },
    });
    const getRes = createMockResponse();
    const getNext = createMockNext();

    await getContextRoute(getReq, getRes, getNext);

    // Verify get response
    expect((getRes as any)._status).toBe(200);
    expect((getRes as any)._json).toHaveProperty("context");
    expect((getRes as any)._json.context.key).toBe(testKey);
    expect((getRes as any)._json.context.message).toBe(testMessage);
    expect((getRes as any)._json.context.metadata).toEqual({ type: "context" });
  });

  test("should handle validation errors for missing key", async () => {
    const { setContextRoute } = await import("../src/routes/context/setContext");
    
    // Create request with missing key
    const req = createMockRequest({
      body: {
        message: "test message without key",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await setContextRoute(req, res, next);

    // Verify validation error
    expect((res as any)._status).toBe(400);
    expect((res as any)._json).toHaveProperty("error", "Key field is required");
  });

  test("should handle non-existent context key", async () => {
    const { getContextRoute } = await import("../src/routes/context/getContext");
    
    const req = createMockRequest({
      body: {
        key: "non-existent-key",
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await getContextRoute(req, res, next);

    // Verify error response
    expect((res as any)._status).toBe(400);
    expect((res as any)._json).toHaveProperty("error", "Context not found");
  });

  test("should update existing context when setting with same key", async () => {
    const { setContextRoute, setContext } = await import("../src/routes/context/setContext");
    const { getContext } = await import("../src/routes/context/getContext");
    
    const testKey = "update-test-key";
    const firstMessage = "First message";
    const secondMessage = "Updated message";
    
    // Set initial context
    await setContext({ key: testKey, message: firstMessage });
    
    // Update context with same key
    await setContext({ key: testKey, message: secondMessage });
    
    // Get context
    const result = await getContext({ key: testKey });
    
    // Verify updated message
    expect("context" in result).toBe(true);
    if ("context" in result) {
      expect(result.context.message).toBe(secondMessage);
    }
    
    // Verify only one record exists
    const count = db.query("SELECT COUNT(*) as count FROM documents WHERE external_id = ? AND source = 'context'")
      .get(testKey) as { count: number };
    expect(count.count).toBe(1);
  });
});
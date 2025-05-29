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

describe("Context Routes", () => {
  let db: Database;

  beforeAll(async () => {
    // Create fresh database
    db = new Database("******");
    
    // Configure database
    db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(db);
    db.exec(createDocumentsTableSQL("1536"));
    
    // Spy on database module to return our test db
    mock.module("../src/database/database", () => ({
      db: db,
      getDb: () => db
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
    const setRequest = new Request("http://localhost/set-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: testKey,
        message: testMessage,
      }),
    });

    const setResponse = await setContextRoute(setRequest);
    const setResponseData = await setResponse.json();

    // Verify set response
    expect(setResponse.status).toBe(200);
    expect(setResponseData).toHaveProperty("message", "Context successfully set");

    // Get context
    const getRequest = new Request("http://localhost/get-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: testKey,
      }),
    });

    const getResponse = await getContextRoute(getRequest);
    const getResponseData = await getResponse.json();

    // Verify get response
    expect(getResponse.status).toBe(200);
    expect(getResponseData).toHaveProperty("context");
    expect(getResponseData.context.key).toBe(testKey);
    expect(getResponseData.context.message).toBe(testMessage);
    expect(getResponseData.context.metadata).toEqual({ type: "context" });
  });

  test("should handle validation errors for missing key", async () => {
    const { setContextRoute } = await import("../src/routes/context/setContext");
    
    // Create request with missing key
    const request = new Request("http://localhost/set-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "test message without key",
      }),
    });

    const response = await setContextRoute(request);
    const responseData = await response.json();

    // Verify validation error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Validation failed");
  });

  test("should handle non-existent context key", async () => {
    const { getContextRoute } = await import("../src/routes/context/getContext");
    
    const request = new Request("http://localhost/get-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "non-existent-key",
      }),
    });

    const response = await getContextRoute(request);
    const responseData = await response.json();

    // Verify error response
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty("error", "Context not found");
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
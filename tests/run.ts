// Override Bun's test function to run each file individually
// This ensures each test has its own database connection/environment
import { spawnSync } from "child_process";

// Exclude this file from the tests to run
const testFiles = [
  "./tests/splitTextIntoChunks.test.ts",
  "./tests/indexRoute.test.ts", 
  "./tests/searchRoute.test.ts",
  "./tests/documentRoute.test.ts",
  "./tests/embedding-model-change.test.ts"
];

let allTestsPassing = true;

for (const testFile of testFiles) {
  console.log(`\n--- Running tests in ${testFile} ---\n`);
  
  // Run each test file in its own process with in-memory database
  const result = spawnSync("bun", ["test", testFile], { 
    stdio: "inherit",
    env: { 
      ...process.env, 
      // Use in-memory database for tests
      DATABASE_PATH: "******" 
    }
  });
  
  if (result.status !== 0) {
    allTestsPassing = false;
    console.error(`❌ Tests in ${testFile} failed with status ${result.status}`);
  } else {
    console.log(`✅ Tests in ${testFile} passed`);
  }
}

if (!allTestsPassing) {
  process.exit(1);
}

console.log("\n✅ All tests passed!");
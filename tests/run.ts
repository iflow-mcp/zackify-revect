import { spawnSync } from "child_process";

// Run each test file separately to avoid database connection issues
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
  const result = spawnSync("bun", ["test", testFile], { 
    stdio: "inherit",
    env: { ...process.env, DATABASE_PATH: "******" }
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

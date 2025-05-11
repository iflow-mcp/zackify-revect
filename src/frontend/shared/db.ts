import * as duckdb from "@duckdb/duckdb-wasm";

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

// Select a bundle based on browser checks
export const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

export const worker_url = URL.createObjectURL(
  new Blob([`importScripts("${bundle.mainWorker!}");`], {
    type: "text/javascript",
  })
);

// Instantiate the asynchronus version of DuckDB-Wasm
const worker = new Worker(worker_url);
const logger = new duckdb.ConsoleLogger();
export const db = new duckdb.AsyncDuckDB(logger, worker);

// URL.revokeObjectURL(worker_url);

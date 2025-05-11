import { bundle, db } from "./db";
import { fetchAndRegisterDb } from "./fetchAndRegisterDb";

export const loadCurrentMonth = async () => {
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  const now = new Date();
  const year = now.getFullYear().toString();
  // Months are 0-indexed, so add 1. Pad with 0 if needed.
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  // one month only for now, use this to compute the name and download more
  const periods = [{ year, month }];

  await fetchAndRegisterDb({ periods, db });

  const c = await db.connect();

  // todo make helpers that do query and join accross every DB, or does one query per attached period db
  const result = await c.query(`
    SELECT * FROM db202505.documents
  `);
  console.log(result.toArray().map((row) => row.toJSON()));
};

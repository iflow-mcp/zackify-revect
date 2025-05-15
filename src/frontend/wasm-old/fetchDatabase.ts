import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

type Props = {
  db: AsyncDuckDB;
};

const getBuffer = async (path: string) => {
  //todo auth to web app
  const response = await fetch(path, { headers: { Authorization: "test" } });
  const blob = await response.blob();
  return await blob.arrayBuffer();
};
export const fetchDatabase = async ({ db }: Props) => {
  const c = await db.connect();

  const dbfile = await getBuffer(`/db`);
  const wal = await getBuffer(`/db.wal`);

  console.log(
    `Database fetched, size: ${(
      (dbfile.byteLength + wal.byteLength) /
      1048576
    ).toFixed(2)} MB.`
  );

  await db.registerFileBuffer(`data.db`, new Uint8Array(dbfile));
  await db.registerFileBuffer(`data.db.wal`, new Uint8Array(wal));

  await c.query(`ATTACH 'data.db' AS db;`);
  await c.query(`USE db;LOAD vss;`);

  return c;
};

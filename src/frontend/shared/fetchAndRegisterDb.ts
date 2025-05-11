import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

type Props = {
  periods: {
    year: string;
    month: string;
  }[];

  db: AsyncDuckDB;
};

const getBuffer = async (path: string) => {
  const response = await fetch(path);
  const blob = await response.blob();
  return await blob.arrayBuffer();
};
export const fetchAndRegisterDb = async ({ periods, db }: Props) => {
  const c = await db.connect();

  for (let period of periods) {
    const name = `${period.year}/${period.month}`;
    const dbfile = await getBuffer(`/db/${name}`);
    const wal = await getBuffer(`/db/${name}/wal`);

    console.log(`Database fetched, size: ${dbfile.byteLength} bytes.`);

    await db.registerFileBuffer(`${name}.db`, new Uint8Array(dbfile));
    await db.registerFileBuffer(`${name}.db.wal`, new Uint8Array(wal));

    await c.query(`ATTACH '${name}.db' AS db${period.year}${period.month};`);
  }

  c.close();
};

export const dbRoute = async () => {
  return new Response(Bun.file(`./data.duckdb`));
};

export const dbWalRoute = async () => {
  if (!(await Bun.file(`./data.duckdb.wal`).exists()))
    return new Response(null, { status: 404 });

  return new Response(Bun.file(`./data.duckdb.wal`));
};

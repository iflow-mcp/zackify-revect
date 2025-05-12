type Props = {
  apiUrl: string;
  text: string;
  external_id: string;
};
export const indexToApi = async ({ apiUrl, text, external_id }: Props) => {
  const res = await fetch(`${apiUrl}/index`, {
    method: "POST",
    body: JSON.stringify({
      text,
      external_id,
      metadata: {
        source: "obsidian",
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(await res.json());
};

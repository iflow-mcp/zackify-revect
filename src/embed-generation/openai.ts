import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generate = async (input: string) => {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    encoding_format: "float",
    input,
  });

  return response.data[0]?.embedding;
};

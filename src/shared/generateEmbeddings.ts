import OpenAI from "openai";

export const generateEmbeddings = async (
  input: string,
  config: { apiKey: string; baseURL?: string }
) => {
  const client = new OpenAI(config);

  const response = await client.embeddings.create({
    model: process.env.AI_EMBEDDING_MODEL as string,
    encoding_format: "float",
    input,
  });

  return response.data[0]?.embedding;
};

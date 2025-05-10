import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Callback function to update model loading progress

// const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

const run = async () => {
  const engine = await CreateMLCEngine(
    //todo compile our own bigger better ones and let user choose in the popup settings page
    // let each new month be set to a different one one day, reuse the older model
    "snowflake-arctic-embed-m-q0f32-MLC-b32",
    {
      initProgressCallback: (initProgress) => {
        console.log(initProgress);
      },
    } // engineConfig
  );

  const reply = await engine.embeddings.create({
    input: "i really love apples",
  });
  console.log(reply.data[0]?.embedding);
  console.log(reply.usage);
};
run();

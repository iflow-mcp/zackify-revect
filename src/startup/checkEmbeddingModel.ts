import { getMetadataValue, metadataTableExists } from "../database/metadata";
import { reembedAllDocuments } from "../database/reembedding";

/**
 * Checks if the embedding model or size have changed and triggers re-embedding if needed
 */
export const checkEmbeddingModel = async (): Promise<void> => {
  try {
    const currentModel = process.env.AI_EMBEDDING_MODEL;
    const currentSize = process.env.AI_EMBEDDING_SIZE;

    if (!currentModel) {
      console.warn(
        "Warning: AI_EMBEDDING_MODEL not set in environment variables"
      );
      return;
    }

    // Check if this is a brand new database (no metadata table)
    if (!metadataTableExists()) {
      console.log(
        "Brand new database detected, MIGREATIONS SHOULD HAVE RAN ALREADY"
      );
      console.log(
        `Will use embedding model: ${currentModel}${
          currentSize ? `, size: ${currentSize}` : ""
        }`
      );
      return;
    }

    // Get stored embedding model and size from metadata
    const storedModel = getMetadataValue("AI_EMBEDDING_MODEL");
    const storedSize = getMetadataValue("AI_EMBEDDING_SIZE");

    // If model or size is different, or if they weren't stored before
    if (
      storedModel !== currentModel ||
      (currentSize && storedSize !== currentSize)
    ) {
      console.log("Embedding configuration has changed:");

      if (storedModel !== currentModel) {
        console.log(
          `- Model changed from ${storedModel || "not set"} to ${currentModel}`
        );
      }

      if (currentSize && storedSize !== currentSize) {
        console.log(
          `- Size changed from ${storedSize || "not set"} to ${currentSize}`
        );
      }

      // Re-embed all documents and chunks
      await reembedAllDocuments();
    } else {
      console.log(
        `Using embedding model: ${currentModel}${
          currentSize ? `, size: ${currentSize}` : ""
        }`
      );
    }
  } catch (error) {
    console.error("Error checking embedding model configuration:", error);
  }
};

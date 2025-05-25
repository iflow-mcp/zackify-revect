import { db } from "./database";
import { generateEmbeddings } from "../shared/generateEmbeddings";
import { setMetadataValue } from "./metadata";

/**
 * Re-embeds all documents and document chunks using the current embedding model
 * @returns A promise that resolves when re-embedding is complete
 */
export const reembedAllDocuments = async (): Promise<void> => {
  console.log("Starting re-embedding process for all documents and chunks...");
  const apiKey = process.env.AI_API_KEY as string;
  const baseURL = process.env.AI_BASE_URL;
  const embeddingModel = process.env.AI_EMBEDDING_MODEL as string;
  const embeddingSize = process.env.AI_EMBEDDING_SIZE as string;
  
  if (!apiKey) {
    console.error("Cannot re-embed: Missing API key");
    return;
  }

  try {
    // Prepare database for batch operations
    await db.run("BEGIN TRANSACTION");

    // Get all documents
    const documents = db.query("SELECT id, text FROM documents").all() as { id: number; text: string }[];
    console.log(`Found ${documents.length} documents to re-embed`);
    
    let processedDocs = 0;
    // Process each document
    for (const doc of documents) {
      try {
        // Generate new embeddings
        const embeddings = await generateEmbeddings(doc.text, {
          apiKey,
          baseURL,
        });
        
        if (embeddings) {
          // Update document with new embeddings
          db.query("UPDATE documents SET embeddings = ? WHERE id = ?").run(
            `[${embeddings.join(",")}]`, 
            doc.id
          );
          processedDocs++;
          
          if (processedDocs % 10 === 0 || processedDocs === documents.length) {
            console.log(`Re-embedded ${processedDocs}/${documents.length} documents`);
            
            // Commit in batches to avoid holding transaction too long
            if (processedDocs % 100 === 0 && processedDocs !== documents.length) {
              await db.run("COMMIT");
              await db.run("BEGIN TRANSACTION");
            }
          }
        }
      } catch (error) {
        console.error(`Error re-embedding document ${doc.id}:`, error);
      }
    }
    
    // Commit document changes
    await db.run("COMMIT");
    
    // Start new transaction for chunks
    await db.run("BEGIN TRANSACTION");
    
    // Get all document chunks
    const chunks = db.query("SELECT id, document_id, text FROM document_chunks").all() as { 
      id: number; 
      document_id: number;
      text: string;
    }[];
    
    console.log(`Found ${chunks.length} document chunks to re-embed`);
    
    let processedChunks = 0;
    // Process each chunk
    for (const chunk of chunks) {
      try {
        // Generate new embeddings
        const embeddings = await generateEmbeddings(chunk.text, {
          apiKey,
          baseURL,
        });
        
        if (embeddings) {
          // Update chunk with new embeddings
          db.query("UPDATE document_chunks SET embeddings = ? WHERE id = ?").run(
            `[${embeddings.join(",")}]`, 
            chunk.id
          );
          processedChunks++;
          
          if (processedChunks % 50 === 0 || processedChunks === chunks.length) {
            console.log(`Re-embedded ${processedChunks}/${chunks.length} document chunks`);
            
            // Commit in batches to avoid holding transaction too long
            if (processedChunks % 200 === 0 && processedChunks !== chunks.length) {
              await db.run("COMMIT");
              await db.run("BEGIN TRANSACTION");
            }
          }
        }
      } catch (error) {
        console.error(`Error re-embedding document chunk ${chunk.id}:`, error);
      }
    }
    
    // Commit chunk changes
    await db.run("COMMIT");
    
    // Update metadata with current model and size
    setMetadataValue("AI_EMBEDDING_MODEL", embeddingModel);
    setMetadataValue("AI_EMBEDDING_SIZE", embeddingSize || "");
    
    console.log("Re-embedding process completed successfully");
  } catch (error) {
    // Ensure transaction is rolled back if an error occurs
    try {
      await db.run("ROLLBACK");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    console.error("Error during re-embedding process:", error);
  }
};
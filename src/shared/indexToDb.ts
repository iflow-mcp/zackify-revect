import { sql } from "bun";

type Props = {
  external_id?: string;
  text: string;
  source: string;
  embeddings: number[];
  metadata?: Record<string, any> | undefined;
};

export const indexToDb = async (data: Props) => {
  try {
    // Check if document with this external_id already exists
    if (data.external_id) {
      const [existingDoc] =
        await sql`SELECT id FROM documents WHERE external_id = ${data.external_id}`;

      if (existingDoc) {
        // Update existing document
        const result = await sql.unsafe(
          `
            UPDATE documents 
            SET 
              text = $2,
              metadata = $3,
              embeddings = $4,
              source = $5
            WHERE external_id = $1
          `,
          [
            data.external_id,
            data.text,
            JSON.stringify(data.metadata || {}),
            `[${data.embeddings.join(",")}]`,
            data.source,
          ]
        );
        console.log(`Updated document with external_id ${data.external_id}`);
        return;
      }
    }

    // Insert new document if no existing document was found or no external_id provided
    const result = await sql.unsafe(
      `
        INSERT INTO documents (external_id, text, metadata, embeddings, source)
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
      `,
      [
        data.external_id,
        data.text,
        JSON.stringify(data.metadata || {}),
        `[${data.embeddings.join(",")}]`,
        data.source,
      ]
    );

    console.log(`Inserted ${result} document ${data.external_id}`);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error with document ${data.external_id}:`, e.message);
    }
  }
};

# next:

make /search route that does full text search and support semantic search

make docker file for this and have 1 command to run it and start indexing everything

# next:

need to chunk data we get by character count / new line break chunks. maybe paragraphs or something. and change how we index

document_chunks table that references document id by foreign key, so if a document exists, then we can reindex and delete those correctly

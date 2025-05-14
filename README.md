# next:

make /search route that does full text search and support semantic search

make docker file for this and have 1 command to run it and start indexing everything

# next:

need to chunk data we get by character count / new line break chunks. maybe paragraphs or something. and change how we index

document_chunks table that references document id by foreign key, so if a document exists, then we can reindex and delete those correctly

# ci todo:

```
docker build . -t zachrebuild/revect.io:latest --platform linux/amd64
docker push zachrebuild/revect.io:latest
gcloud run services replace service.yml
```

next:

store in GCS for the db and then the private version should sort of be close to running all the way??

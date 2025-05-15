# todo!!!

- make locking check because many requests can come in and we need to lock and wait and release
- we only need this so its ready for cloud hosting, otherwise we could just open and keep open the connection

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

#next:

have to provide a way to re-embed all existing tables, with re-embed endpoint, and power the embed active model based off db metadata table that needs to store that info as to waht embedding model is used inside the entire thing

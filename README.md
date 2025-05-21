# revect

open source version

# run

```
docker run \
  -p 3009:3000 \
  -v ~/Documents/revect:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="ollama" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:latest
```

## Docker Images

Docker images are automatically built and published to Docker Hub when a new release is created. The following tags are available:

- `zachrebuild/revect.io:latest` - Latest release
- `zachrebuild/revect.io:<version>` - Specific version (e.g., `1.0.0`)
- `zachrebuild/revect.io:<major>.<minor>` - Major.minor version (e.g., `1.0`)
- `zachrebuild/revect.io:sha-<commit>` - Specific commit

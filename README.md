# revect

> **Note:** This project is currently in alpha release. Features and interfaces may change.

## Current Features

- **Own your data**: everything is stored in a simple sqlite file
- **Streaming HTTP MCP server**: index and recall information from any AI system, Claude desktop support

## Upcoming Features

- [ ] Browser extension to auto save or choose to save when right clicking on URLs and articles
- [ ] Obsidian extension to pull in all content and search inside obsidian
- [ ] Web interface to search more deeply and interact better with your data
- [ ] Mobile apps for iOS and Android
- [ ] More 3rd party integrations

## Getting Started

### Running with Docker

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
  zachrebuild/revect.io:6
```

### MCP Setup

To use revect with the MCP (Model Context Protocol) for AI integrations:

1. Use npx with mcp-remote:
```bash
npx @modelcontextprotocol/mcp-remote
```

2. Connect to your revect instance using:
```
mcp-remote http://localhost:3000/mcp
```

You can also use this URL directly in supported MCP tools.

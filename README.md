# revect 🚀 ✨ 🧠

<!-- Demo video placeholder - Coming soon! -->
<p align="center">🎬 Demo video coming soon! 🎬</p>

[![Docker Pulls](https://img.shields.io/docker/pulls/zachrebuild/revect.io)](https://hub.docker.com/r/zachrebuild/revect.io)
[![GitHub Issues](https://img.shields.io/github/issues/zackify/revect)](https://github.com/zackify/revect/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-black?logo=bun)](https://bun.sh/)

> **Note:** This project is currently in alpha release. Features and interfaces may change.

**Re**call **vect**ors is your personal memory vault 🔒 - a self-hosted tool to persist and recall any information indefinitely. Never lose valuable knowledge again!

With MCP support, you can use revect as a private way to own your data and recall it seamlessly in any AI system. Your data, your control. 🛡️

- 🔍 Find and retrieve articles from your past with powerful semantic search
- 💾 Store your data in a simple, portable SQLite file format
- 💬 Instantly recall past conversations across different AI providers
- 🔒 Enjoy complete privacy with fully local, offline operation
- 🔌 Connect with expanding web interfaces and third-party integrations
- 🤖 Use any embedding model or AI provider!

## ✨ More Reasons to Use

- 🔄 Minimal dependencies, **100mb** complete container size
- 🤖 Soon you will be able to change the embedding model, and we will automatically update all of your content
- 🧩 Extensible architecture with plans for many extensions
- 🏠 **Own your data**: everything is stored in a simple SQLite file
- 🌊 **Streaming HTTP MCP server**: index and recall information from any AI system, Claude desktop support as well.

If you wish to support the project or access your data across multiple devices, we recommend revect cloud (coming soon) ☁️.
It's our hosted platform with additional features and seamless synchronization.

## 🔮 Upcoming Features

- [ ] 🌐 Browser extension to auto-save or choose to save when right-clicking on URLs and articles
- [ ] 📝 Obsidian extension to pull in all content and search inside Obsidian
- [ ] 🖥️ Web interface to search more deeply and interact better with your data
- [ ] 📱 Mobile apps for iOS and Android
- [ ] 🔌 More third-party integrations

## 🚀 Getting Started

### 🐳 Running fully local with Docker + Ollama / LM Studio

1. Install ollama or LM Studio
2. `ollama pull mxbai-embed-large`
3. Run the docker container

> **Note:** Any AI provider that follows the OpenAI API specification can be used. Just configure the `AI_BASE_URL` accordingly.

```
docker run \
  -p 8000:3000 \
  -v ~/Documents/revect:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="key" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --pull always \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:latest
```

### 🧠 Running Multiple Containers

You can run multiple revect containers simultaneously, each with its own dedicated purpose. This allows you to organize your knowledge into separate, focused databases. Each container is very simple and efficient, using only 50MB of RAM to stay running in Docker.

**Example use cases:**
- One container for general knowledge (articles, notes, personal memories)
- One container for coding-related knowledge (tutorials, documentation, code snippets)

To run multiple containers, use different ports and volume mounts:

```
# Container 1: General Knowledge
docker run \
  -p 8000:3000 \
  -v ~/Documents/revect-general:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="key" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --pull always \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:latest

# Container 2: Coding Knowledge
docker run \
  -p 8001:3000 \
  -v ~/Documents/revect-coding:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="key" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --pull always \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:latest
```

You can then connect to your specific knowledge base through MCP by using the appropriate port:

```
# Connect to general knowledge base
http://localhost:8000/mcp

# Connect to coding knowledge base
http://localhost:8001/mcp
```

This approach lets you ask your AI to recall from specific knowledge domains. For example:
- "Connect to my general knowledge base and recall that article about climate change"
- "Connect to my coding knowledge base and recall how I implemented that React pagination component last month"

### 🔌 MCP Setup

To use revect with the MCP (Model Context Protocol) for AI integrations:

1. Direct connect in supported tools:

```
http://localhost:8000/mcp
```

2. Usage with mcp-remote:

```bash
{
  "mcpServers": {
    "revect": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8000/mcp"]
    }
  }
}
```

### 💬 MCP Usage

At any time, ask your AI to "recall" something. For example:

> 🔍 "Recall that hockey article from yesterday for me"

It will return the source URL and information from chunks of the article that match your search.

To get the full document back, you can ask:

> 🔍 "give me the entire document for that snippet"

or provide it the ID of the document, which would be given in the first step.

Maybe the article mentioned "Baseball", it would still show up as they are both sports.

The other option is asking your model to "save" or "index" content:

> 💾 "Index the discussion above for me"

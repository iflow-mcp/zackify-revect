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

## Revect Features

- 🔍 Find and retrieve articles from your past with powerful semantic search
- 💾 Store your data in a simple, portable SQLite file format
- 💬 Instantly recall past conversations across different AI providers
- 🔒 Enjoy complete privacy with fully local, offline operation
- 🔌 Connect with expanding web interfaces and third-party integrations

## ✨ More Reasons to Use

- 🔄 Minimal dependencies, **less than 100mb** container size
- 🤖 Bring any embedding model of your choice
- 🧩 Extensible architecture with plans for many extensions
- 🏠 **Own your data**: everything is stored in a simple SQLite file
- 🌊 **Streaming HTTP MCP server**: index and recall information from any AI system, Claude desktop support

If you wish to support the project or access your data across multiple devices, we recommend [revect cloud](https://revect.io/cloud) ☁️.
It's our hosted platform with additional features and seamless synchronization.

## 🔮 Upcoming Features

- [ ] 🌐 Browser extension to auto-save or choose to save when right-clicking on URLs and articles
- [ ] 📝 Obsidian extension to pull in all content and search inside Obsidian
- [ ] 🖥️ Web interface to search more deeply and interact better with your data
- [ ] 📱 Mobile apps for iOS and Android
- [ ] 🔌 More third-party integrations


## 🚀 Getting Started

### 🐳 Running with Docker

```
docker run \
  -p 3009:3000 \
  -v ~/Documents/revect:/app/data \
  -e AI_BASE_URL="http://host.docker.internal:11434/v1" \
  -e AI_API_KEY="key" \
  -e AI_EMBEDDING_MODEL="mxbai-embed-large" \
  -e AI_EMBEDDING_SIZE="1024" \
  -e API_SECRET="test" \
  --add-host=host.docker.internal:host-gateway \
  zachrebuild/revect.io:latest
```

### 🔌 MCP Setup

To use revect with the MCP (Model Context Protocol) for AI integrations:

1. Direct connect in supported tools:

```
http://localhost:3000/mcp
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

It will return the source URL and information from the article for you to review.

The other option is asking your model to "save" or "index" content:

> 💾 "Index the discussion above for me"

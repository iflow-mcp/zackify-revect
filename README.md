# revect 🚀 ✨ 🧠

<!-- Demo video placeholder - Coming soon! -->
<p align="center">🎬 Demo video coming soon! See <a href="#-examples">Examples</a> below for usage screenshots. 🎬</p>

[![Docker Pulls](https://img.shields.io/docker/pulls/zachrebuild/revect.io)](https://hub.docker.com/r/zachrebuild/revect.io)
[![GitHub Issues](https://img.shields.io/github/issues/zackify/revect)](https://github.com/zackify/revect/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-black?logo=bun)](https://bun.sh/)

> **Note:** This project is currently in alpha release. Features and interfaces may change.

**Re**call **vect**ors is your personal memory vault 🔒 - a self-hosted tool to persist and recall any information indefinitely. Never lose valuable knowledge again!

## 🎯 What was this made for?

Originally built for **recalling articles and blog posts** you've read in the past without remembering the exact title or content. You know you read something relevant, but can't quite recall the details? revect helps you find it with semantic search! 📚

But we've realized it's incredibly useful for **shared and persistent memory for teams and individuals across many AI tools**. Whether you're working solo or collaborating with others, revect becomes your collective knowledge base that any AI can tap into. 🤝

With MCP support, you can use revect as a private way to own your data and recall it seamlessly in any AI system. Your data, your control. 🛡️

> 🔄 **Embedding Model Freedom**: Bring any embedding model, any size - from tiny efficient models to massive powerhouses. Swap between OpenAI, local Ollama models, or any OpenAI-compatible provider instantly. revect automatically re-embeds your entire database when you switch, ensuring zero data loss and maximum flexibility! 🪄

- 🏗️ **Single Service Simplicity** - Just one container vs complex multi-service alternatives - simpler architecture, easier setup
- 💾 **Portable & Browsable** - Store data in SQLite that you can browse anytime with any SQLite viewer
- 🔍 **Semantic Superpowers** - Find and retrieve articles from your past with powerful semantic search
- 💬 **AI Memory Bridge** - Instantly recall past conversations across different AI providers
- 🔒 **Privacy First** - Enjoy complete privacy with fully local, offline operation
- 🔌 **Extensible Ecosystem** - Connect with expanding web interfaces and third-party integrations
- 🤖 **Model Agnostic** - Use any embedding model or AI provider!

## ✨ More Reasons to Use

- 🔄 **Lightweight Champion** - Minimal dependencies, **100mb** complete container size
- 🤖 **Future-Proof Embeddings** - Change embedding models anytime, we'll automatically update all your content
- 🧩 **Plugin Paradise** - Extensible architecture with plans for many extensions
- 🏠 **True Data Ownership** - Everything stored in a simple SQLite file you control
- 🌊 **Real-time MCP Magic** - Streaming HTTP MCP server for seamless AI integration

## 📚 Table of Contents

- [🔮 Upcoming Features](#-upcoming-features)
- [🚀 Getting Started](#-getting-started)
  - [🐳 Docker + Local AI Setup](#-running-fully-local-with-docker--ollama--lm-studio)
  - [🧠 Running Multiple Containers](#-running-multiple-containers)
  - [🔌 MCP Configuration](#-mcp-setup)
  - [🔌 Claude Code Setup](#-claude-code-setup)
  - [💬 Using MCP](#-mcp-usage)
  - [🔄 Switching Embedding Models](#-switching-embedding-models)
- [☁️ Cloud Option](#️-cloud-option)
- [🤝 Contributing](#-contributing)
- [📖 Examples](#-examples)

If you wish to support the project or access your data across multiple devices, we recommend revect cloud (coming soon) ☁️.
It's our hosted platform with additional features and seamless synchronization.

## 🔮 Upcoming Features

Get excited about what's coming next! 🎉

- [ ] 🔍 **Advanced Search Types** - Date range filtering, exact match search, and other search refinements
- [ ] 🌐 **Browser Extension** - Auto-save or right-click to save URLs and articles
- [ ] 📝 **Obsidian Integration** - Pull in all content and search inside Obsidian
- [ ] 🖥️ **Web Dashboard** - Search more deeply and interact better with your data
- [ ] 📱 **Mobile Apps** - Native iOS and Android applications
- [ ] 🔌 **Integration Explosion** - More third-party integrations coming soon

## 🚀 Getting Started

### 🐳 Running fully local with Docker + Ollama / LM Studio

Get up and running in minutes with your own private AI memory system! 🏃‍♂️

1. **Install your AI backend** - Choose Ollama, LM Studio, or a hosted platform
2. **Pull an embedding model** - `ollama pull mxbai-embed-large`
3. **Launch revect** - Run the Docker container below

> **Pro Tip:** Any AI provider that follows the OpenAI API specification can be used. Just configure the `AI_BASE_URL` accordingly! 🎯

```bash
docker run \
  -p 8000:8000 \
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
  -p 8000:8000 \
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
  -p 8001:8000 \
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

<p align="center">🎬 <i>Video example: Adding revect to your command line interface</i> - Coming soon! 🎬</p>

### 🔌 MCP Setup

Connect revect to your favorite AI tools with the Model Context Protocol! 🤝

> **Note:** revect provides both REST API and MCP service in one unified server, unlike many current MCP projects that require separate services or complex architectures.

1. **Direct Connection** (for supported tools):

```
Name: revect
url: http://localhost:8000/mcp
```

2. **Using mcp-remote** (for broader compatibility with stdio-only clients):

```json
{
  "mcpServers": {
    "revect": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:8000/mcp"]
    }
  }
}
```

### 🔌 Claude Code Setup

Once you have revect configured in Claude Desktop above, you can also add it to Claude Code for seamless access to your memory across all Claude interfaces.

Add to Claude Code with this command:

```bash
claude mcp add-from-claude-desktop
```

Now you can recall information and persist information for quick access outside of Claude Code's hard coded memory files.

**Benefits for multi-environment usage:**
- 🐳 **Perfect for Docker environments** - Access your memory vault from Claude Code running in containers without duplicating configuration files
- 🔄 **Unified MCP client management** - Avoid manually configuring MCP servers across multiple environments and development setups
- 🌐 **Consistent memory access** - Whether you're in Claude Desktop, Claude Code, or other MCP-enabled tools, your memory vault stays connected

### 💬 MCP Usage

Transform your AI into a knowledge powerhouse! Here's how to use revect's MCP features:

#### 🔍 Recalling Information

Ask your AI to "recall" anything from your memory vault:

> "Recall that hockey article from yesterday for me"

The AI will return the source URL and relevant chunks that match your search. Even if the article mentioned "baseball" instead, our semantic search understands they're both sports! 🏒⚾

To retrieve the complete document:

> "Give me the entire document for that snippet"

Or provide the document ID from the first search result.

#### 💾 Saving Knowledge

Preserve important conversations and content:

> "Index the discussion above for me"

Your AI will save the content to your personal knowledge base for future retrieval!

### 🔄 Switching Embedding Models

We know the AI landscape evolves rapidly, so we've got your back! 🛡️

When you need to change embedding models (like when OpenAI deprecates one), simply update your Docker environment:

```bash
AI_EMBEDDING_MODEL="new-model-name"
AI_EMBEDDING_SIZE="1536"
```

**What happens next?** 🪄

- revect detects the change on startup
- Automatically re-embeds your entire database
- Shows progress during the migration
- Zero data loss, maximum flexibility!

> **Cost Alert:** Be mindful when switching to hosted AI services with large databases - local models are free to re-embed! 💰

## ☁️ Cloud Option

Coming soon! Our hosted platform will offer:

- 🔄 Multi-device synchronization
- 🚀 Enhanced performance
- 🛡️ Managed backups
- ✨ Premium features

## 🤝 Contributing

We'd love your help making revect even better! Check out our [issues page](https://github.com/zackify/revect/issues) to get started.

## 📖 Examples

Here are some visual examples of how to use revect with popular AI tools:

### Adding the server to Cline

<img src="https://github.com/user-attachments/assets/c0c097b4-a386-4a6b-a4c6-5dbbbabbe084" alt="Adding revect server to Cline MCP configuration">

### Setting context on the fly in Cline

<img src="https://github.com/user-attachments/assets/ec7b3670-abb1-4291-8955-b2995bb1578a" alt="Setting context on the fly in Cline">

### Retrieving context information in Claude Desktop

<img src="https://github.com/user-attachments/assets/8a3cdb59-c4d3-4ca4-a668-f9c8821083f5" alt="Retrieving context information in Claude Desktop">

### Using context in Cline later on

<img src="https://github.com/user-attachments/assets/3fb861b9-85d1-422c-a1cb-f44bc0e63180" alt="Using context in Cline later on">

---

<p align="center">
  Made with ❤️ by the revect team<br>
  <strong>Your memory. Your data. Your control.</strong>
</p>

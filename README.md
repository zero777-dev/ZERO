# ZERO - Your Personal AI Assistant 🤖

> Like JARVIS from Iron Man - Autonomous, intelligent, always ready

## 🎯 What is ZERO?

ZERO is a personal AI assistant inspired by JARVIS from Iron Man. It's designed to be:

- **Autonomous** - Works independently to complete tasks
- **Intelligent** - Uses deep reasoning and chain-of-thought
- **Offline-capable** - Runs locally with Ollama
- **Self-hosted** - Your data stays on your device
- **Extensible** - Add skills to customize behavior

## ✨ Features

### 🔬 Research & Verification
- Deep web search with multi-source verification
- Fact-checking and citation tracking
- Trend analysis and insights

### 💼 Freelance Automation
- Job search on Upwork, Fiverr, Freelancer, Guru
- Proposal generation
- Application tracking

### 📈 Trading & Markets
- Polymarket market data
- Crypto prices (Coinbase)
- Price alerts and analysis

### 📱 App Automation
- Control any Android app via Accessibility
- Tap, swipe, type, screenshot
- Task automation

### 🧠 Memory System
- Short-term conversation memory
- Long-term vector-based memory
- Learns your preferences

## 🚀 Quick Start

### One-Command Installation

```bash
curl -sL github.com/zero777-dev/zero/raw/main/install.sh | bash
```

### Manual Installation

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Clone
git clone https://github.com/zero777-dev/zero.git
cd zero

# 3. Install dependencies
bun install

# 4. Setup
bun run src/index.ts setup

# 5. Start!
bun run src/index.ts
```

## 📋 Requirements

- **Runtime:** Bun, Node.js 18+, or Deno
- **LLM:** Ollama with mistral model
- **Platform:** Linux, macOS, Android (Termux)

### Install Ollama

```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Android (Termux)
pkg install ollama

# Pull models
ollama pull mistral
ollama pull nomic-embed-text
```

## 📖 Usage

```bash
# Interactive chat
bun run src/index.ts

# Direct command
bun run src/index.ts "Find Python jobs on Upwork"
```

## 🛠️ Tools

| Tool | Description |
|------|-------------|
| `file` | File operations |
| `search` | Web search (SearXNG) |
| `web` | Web scraping |
| `command` | Shell commands |
| `schedule` | Task scheduling |
| `automation` | App automation |
| `freelance` | Job search |
| `trading` | Market data |
| `notify` | Notifications |

## 🤝 Contributing

Contributions welcome!

## 📄 License

MIT License

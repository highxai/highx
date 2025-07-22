# HighX

**HighX** is an AI-native framework for building production-ready AI applications 10x faster. From chatbots to agents, HighX provides a modular, type-safe platform with built-in RAG, multi-model inference, and seamless integrations, all powered by TypeScript.

## ⚠️ Under Development

Please note that some features mentioned below are still in active development and not yet available. Stay tuned for updates as we bring these powerful tools to life!

## 🚀 Features

- ⚡ **Lightning Fast Setup**: Go from idea to production in minutes with intuitive CLI and pre-built templates.
- 🧩 **Modular Architecture**: Extend functionality with a robust plugin ecosystem for chat interfaces, RAG, and more.
- 🛡️ **Enterprise-Grade Security**: SOC 2 Type II compliant with end-to-end encryption and audit trails.
- 🛠️ **Developer-Friendly**: Full TypeScript support with IntelliSense, integrated testing, and debugging tools.
- 🌐 **AI-Native Design**: Built-in support for RAG, vector databases, and multi-model inference.
- 📦 **Universal Integrations**: Connect to 50+ AI providers, databases, and services with ease.

## 📦 Installation

Install HighX globally using Bun:

```bash
bun add -g highx
```

## 🧪 Quick Start

Initialize a new HighX project:

```bash
highx init [project-name]
cd [project-name]
```

Create a new plugin or module:

```bash
highx new [plugin-name]
```

List all available plugins or modules:

```bash
highx list
```

View available commands and options:

```bash
highx help
```

Configure your project in `highx.config.ts`:

```ts
import type { ServerConfig } from "highx";
import path from "node:path";

// Example configuration for the server
const config: ServerConfig = {
  routes: [
    {
      path: "/(.*)",
      method: "ALL",
      handler: {
        type: "proxy",
        proxy: {
          target: "http://localhost:3000",
          rewrite: "^/api/(.*)$ /$1",
        },
      },
    },
    ...
  ],

  plugins: [
    {
      name: "aitrace",
      modulePath: path.resolve(import.meta.dir, "plugins", "./aitrace.ts"),
      hookOn: ["invoke"],
      config: {
        level: "info",
      },
      enabled: true,
    },
  ],
};

// Export the configuration
export default config;

```

Start development:

```bash
highx dev
```

## 🔌 Plugins

HighX’s plugin system enables rapid extension of core functionality. Use community plugins or create your own for features like:

- Chat interfaces
- Retrieval-Augmented Generation (RAG)
- Vector database integration
- Multi-model inference
- Real-time data synchronization

Explore the plugin marketplace at [https://highx.dev/plugins](https://highx.dev/plugins).

## 📚 Documentation

Full documentation, API reference, and examples are available at [https://highx.dev/docs](https://highx.dev/docs).

## 🧑‍💻 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## 📝 License

Apache-2.0 License. See [LICENSE](./LICENSE) for details.

---

Made with ❤️ by the HighX team.

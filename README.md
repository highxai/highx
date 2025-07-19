# HighX

**HighX** is a high-performance, modular, and type-safe reverse proxy and web server built with TypeScript. Designed to be an alternative to NGINX, HighX offers a developer-first experience with plugin support, modern configuration, and first-class TypeScript typings.

## 🚀 Features

- ⚡ **Blazing Fast**: Optimized for performance with minimal overhead.
- 🧩 **Modular Architecture**: Customize and extend easily with a plugin system.
- 🛡️ **Secure by Default**: Smart defaults and best practices included.
- 🛠️ **Developer-Friendly**: Written in TypeScript with full type safety.
- 🌐 **Reverse Proxy & Static File Server**: All-in-one web gateway.
- 📦 **Built-in Middleware Support**: Compose your stack with ease.

## 📦 Installation

```bash
npm install -g highx
```

## 🧪 Quick Start

Create a configuration file `highx.config.ts`:

```ts
import { defineConfig } from 'highx';

export default defineConfig({
	server: {
		port: 8080,
	},
	routes: [
		{
			path: '/api',
			proxy: {
				target: 'http://localhost:5000',
				changeOrigin: true,
			},
		},
		{
			path: '/',
			static: {
				root: './public',
			},
		},
	],
});
```

Start the server:

```bash
highx start
```

## 🔌 Plugins

HighX supports a plugin system for extending core functionality. Write your own or use community plugins to add features like:

- Logging
- Caching
- Rate limiting
- Authentication

## 📚 Documentation

Full documentation is available at [https://highx.dev](https://highx.dev).

## 🧑‍💻 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## 📝 License

Apache-2.0 License. See [LICENSE](./LICENSE) for details.

---

Made with ❤️ by the HighX team.

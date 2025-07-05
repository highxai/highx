import path from 'node:path'
import config from '../server.config'
import ServerConfigSchema from '../validations/config'

// Interface for plugin middleware
type PluginMiddleware = (
	req: Request,
	context: { config: unknown },
) => Response | undefined | Promise<Response | undefined>

// Simple round-robin load balancer
class RoundRobinBalancer {
	private servers: string[]
	private current: number

	constructor(servers: string[]) {
		this.servers = servers
		this.current = 0
	}

	next(): string {
		const server = this.servers[this.current]
		this.current = (this.current + 1) % this.servers.length
		return server
	}
}

export async function startServer() {
	// Validate configuration
	const result = ServerConfigSchema.safeParse(config)
	if (!result.success) {
		console.error('Configuration validation failed:', result.error.format())
		process.exit(1)
	}
	const validatedConfig = result.data

	// Load plugins
	const plugins: PluginMiddleware[] = []
	if (validatedConfig.plugins) {
		for (const plugin of validatedConfig.plugins) {
			if (!plugin.enabled) continue
			try {
				const pluginModule = await import(plugin.modulePath)
				const middleware = pluginModule.default as PluginMiddleware
				plugins.push((req, context) =>
					middleware(req, { config: plugin.config }),
				)
				console.log(`Loaded plugin: ${plugin.name}`)
			} catch (err) {
				console.error(`Failed to load plugin ${plugin.name}:`, err)
			}
		}
	}

	// Load balancer map for proxy configurations
	const balancers = new Map<string, RoundRobinBalancer>()
	if (validatedConfig.proxy) {
		for (const proxyConfig of validatedConfig.proxy) {
			balancers.set(
				proxyConfig.name,
				new RoundRobinBalancer(proxyConfig.upstream.servers),
			)
		}
	}

	// Start Bun server
	Bun.serve({
		port: validatedConfig.http.port,
		hostname: validatedConfig.http.host,
		tls: validatedConfig.http.ssl?.enabled
			? {
					cert: Bun.file(validatedConfig.http.ssl.certPath),
					key: Bun.file(validatedConfig.http.ssl.keyPath),
				}
			: undefined,
		async fetch(req: Request) {
			const url = new URL(req.url)
			let response: Response | void

			// Apply plugins
			for (const plugin of plugins) {
				response = await plugin(req, { config: validatedConfig })
				if (response instanceof Response) return response
			}

			// Route matching
			let routeIndex = 0
			for (const route of validatedConfig.routes) {
				const methodMatch =
					route.method === 'ALL' || route.method === req.method
				const pathMatch = new RegExp(`^${route.path}$`).test(url.pathname)
				if (methodMatch && pathMatch) {
					if (route.handler.type === 'static') {
						const filePath = path.resolve(route.handler.static!.filePath)
						const file = Bun.file(filePath)
						const contentType = file.type
						const headers = new Headers()
						if (route.handler.static!.cacheControl) {
							headers.set('Cache-Control', route.handler.static!.cacheControl)
						}

						let gzippedFile: Uint8Array | null = null
						if (validatedConfig.http.compression?.enabled) {
							headers.set('Content-Encoding', 'gzip')
							const fileData = await file.text()
							gzippedFile = Bun.gzipSync(fileData, {
								level: validatedConfig.http.compression.level || -1,
							})
						}
						headers.set('Content-Type', contentType)
						headers.set('X-Powered-By', 'HighX')
						return new Response(
							validatedConfig.http.compression?.enabled ? gzippedFile : file,
							{ headers },
						)
					}

					if (route.handler.type === 'proxy') {
						const target = route.handler.proxy!.target
						let targetUrl = target + url.pathname

						if (route.handler.proxy!.rewrite) {
							// Split the rewrite string into pattern and replacement
							const [pattern, replacement] =
								route.handler.proxy!.rewrite.split(' ')
							const rewrite = new RegExp(pattern)
							// Replace the pathname using the regex and replacement
							targetUrl = target + url.pathname.replace(rewrite, replacement)
						}

						try {
							const headers = new Headers(req.headers)

							const proxyResponse = await fetch(targetUrl, {
								method: req.method,
								headers,
								body: req.body,
							})

							const resHeaders = new Headers(proxyResponse.headers)
							resHeaders.set('x-powered-by', 'HighX')
							resHeaders.set('HighX-Version', '0.1.1')

							// Just pipe the body as-is, without touching compression
							return new Response(proxyResponse.body, {
								status: proxyResponse.status,
								headers: resHeaders,
							})
						} catch (err) {
							console.log(err)
							return new Response('Proxy error', { status: 500 })
						}
					}

					if (route.handler.type === 'custom') {
						try {
							const handlerModule = await import(
								route.handler.custom!.handlerPath
							)
							const handler = handlerModule[route.handler.custom!.handlerName]
							const result = await handler(req)
							return result instanceof Response
								? result
								: new Response('Invalid handler response', { status: 500 })
						} catch (err) {
							return new Response(`Custom handler error: ${err}`, {
								status: 500,
							})
						}
					}
				}

				if (routeIndex < validatedConfig.routes.length) {
					// Increment
					routeIndex++

					continue
				}
				const notFoundFilePath = path.resolve(
					config.static?.root!,
					config.static?.notFound!,
				)
				const notFoundFile = Bun.file(notFoundFilePath)
				let gzippedFile: Uint8Array | null = null

				const headers = new Headers()
				if (config.http.compression?.enabled) {
					const notFoundFileContent = await notFoundFile.text()
					gzippedFile = Bun.gzipSync(notFoundFileContent, {
						level: config.http.compression.level,
					})
					headers.set('Content-Encoding', 'gzip')
				}

				headers.set('Content-Type', notFoundFile.type)
				headers.set('X-Powered-By', 'HighX')

				return new Response(
					config.http.compression?.enabled ? gzippedFile : notFoundFile,
					{ status: 404, headers },
				)
			}

			// Static file serving (fallback)
			if (validatedConfig.static) {
				const filePath = `${validatedConfig.static.root}${url.pathname === '/' ? `/${validatedConfig.static.index}` : url.pathname}`
				console.log(filePath, 'file path')
				const file = Bun.file(filePath)
				if (await file.exists()) {
					const headers = new Headers()
					if (validatedConfig.static.cache?.enabled) {
						headers.set(
							'Cache-Control',
							`public, max-age=${validatedConfig.static.cache.maxAge}`,
						)
					}
					if (validatedConfig.http.compression?.enabled) {
						headers.set('Content-Encoding', 'gzip')
					}
					return new Response(file, { headers })
				}
			}

			return new Response('Not Found', { status: 404 })
		},
		error(err) {
			return new Response(`Server Error: ${err.message}`, { status: 500 })
		},
	})

	console.log(
		`HighX running on ${validatedConfig.http.host}:${validatedConfig.http.port}`,
	)

	// Basic health check for proxy upstreams
	if (validatedConfig.proxy) {
		for (const proxyConfig of validatedConfig.proxy) {
			if (proxyConfig.healthCheck?.enabled) {
				setInterval(async () => {
					const balancer = balancers.get(proxyConfig.name)
					if (!balancer) return
					const server = balancer.next()
					try {
						const response = await fetch(
							`${server}${proxyConfig.healthCheck?.path}`,
						)
						console.log(`Health check for ${server}: ${response.status}`)
					} catch (err) {
						console.error(`Health check failed for ${server}:`, err)
					}
				}, proxyConfig.healthCheck.interval)
			}
		}
	}
}

import type { PluginMiddleware, ServerConfig } from './types'
import { handleRoutes } from './utils/handleRoutes'
import { runHealthChecks } from './utils/healthCheck'
import { loadPlugins, runPlugins } from './utils/plugin'
import { RoundRobinBalancer } from './utils/roundRobinBalancer'
import { serveStaticFallback } from './utils/serveStaticFallback'

export async function startServer(config: ServerConfig): Promise<void> {
	const plugins: PluginMiddleware[] = await loadPlugins(config.plugins || [])

	const startupPlugins: PluginMiddleware[] = plugins.filter((p) =>
		p.config.hookOn.includes('start'),
	)
	const invokePlugins: PluginMiddleware[] = plugins.filter((p) =>
		p.config.hookOn.includes('invoke'),
	)
	const endPlugins: PluginMiddleware[] = plugins.filter((p) =>
		p.config.hookOn.includes('end'),
	)

	await runPlugins(startupPlugins, null)

	const balancers = new Map<string, RoundRobinBalancer>()
	if (config.proxy) {
		for (const proxyConfig of config.proxy) {
			balancers.set(
				proxyConfig.name,
				new RoundRobinBalancer(proxyConfig.upstream.servers),
			)
		}
	}

	Bun.serve({
		port: config.http.port,
		hostname: config.http.host,
		tls: config.http.ssl?.enabled
			? {
					cert: Bun.file(config.http.ssl.certPath),
					key: Bun.file(config.http.ssl.keyPath),
				}
			: undefined,
		async fetch(req: Request): Promise<Response> {
			const context = await runPlugins(invokePlugins, req)
			if (context instanceof Response) {
				return context
			}

			const routeResponse = await handleRoutes(req, config, context, balancers)
			if (routeResponse) return routeResponse

			await runPlugins(endPlugins, null)

			const staticResponse = await serveStaticFallback(req, config)
			if (staticResponse) return staticResponse

			return new Response('Not Found', { status: 404 })
		},
		error(err): Response {
			return new Response(`Server Error: ${err.message}`, { status: 500 })
		},
	})

	console.log(`--HighX running on ${config.http.host}:${config.http.port}--`)

	runHealthChecks(config.proxy || [], balancers)
}

import type { PluginMiddleware } from './types'
import { validateServerConfig } from './utils/config'
import { handleRoutes } from './utils/handleRoutes'
import { runHealthChecks } from './utils/healthCheck'
import { loadPlugins, runPlugins } from './utils/plugin'
import { RoundRobinBalancer } from './utils/roundRobinBalancer'
import { serveStaticFallback } from './utils/serveStaticFallback'

export async function startServer(): Promise<void> {
	const validatedConfig = validateServerConfig()
	const plugins: PluginMiddleware[] = await loadPlugins(
		validatedConfig.plugins || [],
	)

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
	if (validatedConfig.proxy) {
		for (const proxyConfig of validatedConfig.proxy) {
			balancers.set(
				proxyConfig.name,
				new RoundRobinBalancer(proxyConfig.upstream.servers),
			)
		}
	}

	Bun.serve({
		port: validatedConfig.http.port,
		hostname: validatedConfig.http.host,
		tls: validatedConfig.http.ssl?.enabled
			? {
					cert: Bun.file(validatedConfig.http.ssl.certPath),
					key: Bun.file(validatedConfig.http.ssl.keyPath),
				}
			: undefined,
		async fetch(req: Request): Promise<Response> {
			const context = await runPlugins(invokePlugins, req)
			if (context instanceof Response) {
				return context
			}

			const routeResponse = await handleRoutes(
				req,
				validatedConfig,
				context,
				balancers,
			)
			if (routeResponse) return routeResponse

			await runPlugins(endPlugins, null)

			const staticResponse = await serveStaticFallback(req, validatedConfig)
			if (staticResponse) return staticResponse

			return new Response('Not Found', { status: 404 })
		},
		error(err) {
			return new Response(`Server Error: ${err.message}`, { status: 500 })
		},
	})

	console.log(
		`HighX running on ${validatedConfig.http.host}:${validatedConfig.http.port}`,
	)

	runHealthChecks(validatedConfig.proxy || [], balancers)
}

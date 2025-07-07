import type {
	AiConfig,
	HandlerContext,
	PluginConfig,
	PluginMiddleware,
} from './types'
import { validateServerConfig } from './utils/config'
import { handleRoutes } from './utils/handleRoutes'
import { runHealthChecks } from './utils/healthCheck'
import { loadPlugins } from './utils/loadPlugins'
import { RoundRobinBalancer } from './utils/roundRobinBalancer'
import { serveStaticFallback } from './utils/serveStaticFallback'

export async function startServer(): Promise<void> {
	const validatedConfig = validateServerConfig()
	const plugins: PluginMiddleware[] = await loadPlugins(
		validatedConfig.plugins || [],
	)

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
			const context: HandlerContext = {
				name: '',
				modulePath: '',
				config: undefined,
				pluginData: {}, // Initialize pluginData
			}

			for (const [index, plugin] of plugins.entries()) {
				const response = await plugin.call(req, {
					name: validatedConfig.plugins![index].name,
					modulePath: validatedConfig.plugins![index].modulePath,
					config: validatedConfig.plugins![index].config as
						| PluginConfig
						| AiConfig,
					pluginData: index === 0 ? { firstMember: true } : context.pluginData,
				})
				if (response instanceof Response) return response
				if (response !== undefined) {
					// Store plugin data with a key (e.g., plugin index or name)
					context.pluginData[`plugin_${validatedConfig.plugins![index].name}`] =
						response
				}
			}

			const routeResponse = await handleRoutes(
				req,
				validatedConfig,
				context,
				balancers,
			)
			if (routeResponse) return routeResponse

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

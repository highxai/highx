import type z from 'zod/v4'
import type {
	PluginConfigSchema,
	ProxyConfigSchema,
	ServerConfigSchema,
} from './schema/serverConfig'

/**
 * Plugin middleware type
 */
export type PluginMiddleware = {
	config: PluginConfig
	call: (
		req: Request | null,
		context: HandlerContext,
	) =>
		| Response
		| undefined
		| Record<string, unknown>
		| Promise<Response | undefined | Record<string, unknown>>
}

/**
 * Context passed to plugins and route handlers
 */
export interface HandlerContext {
	name: string
	modulePath: string
	config?: PluginConfig
	pluginData: Record<string, unknown>
}

/**
 * Proxy route configuration interface
 */
export interface ProxyRouteConfig {
	name: string
	upstream: {
		servers: string[]
	}
	healthCheck?: {
		enabled: boolean
		path: string
		interval: number
	}
}

/**
 * AI configuration
 */
export type ProxyConfig = z.infer<typeof ProxyConfigSchema>
export type ServerConfig = z.infer<typeof ServerConfigSchema>
export type PluginConfig = z.infer<typeof PluginConfigSchema>

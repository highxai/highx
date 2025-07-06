import type z from 'zod/v4'
import type {
	PluginConfigSchema,
	ProxyConfigSchema,
	ServerConfigSchema,
} from './schema/serverConfig'

/**
 * Plugin middleware type
 */
export type PluginMiddleware = (
	req: Request,
	context: HandlerContext,
) => Response | undefined | Promise<Response | undefined>

/**
 * Context passed to plugins and route handlers
 */
export interface HandlerContext {
	config: unknown
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

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>
export type ServerConfig = z.infer<typeof ServerConfigSchema>
export type PluginConfig = z.infer<typeof PluginConfigSchema>

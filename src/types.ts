import type z from 'zod/v4'
import type {
	AiConfigSchema,
	PluginConfigSchema,
	ProxyConfigSchema,
	ServerConfigSchema,
} from './schema/serverConfig'

/**
 * Plugin middleware type
 */
export type PluginMiddleware = {
	name: string
	call: (
		req: Request,
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
	name: string;
	modulePath: string;
	config?: PluginConfig | AiConfig
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
 * AI context for storing conversation or RAG data
 */
export interface AiContext {
	id: string
	userId?: string
	data: unknown
	timestamp: number
}

/**
 * AI graph workflow node
 */
export interface AiGraphNode {
	id: string
	type: 'model' | 'retrieval' | 'output'
	config: {
		model?: string
		prompt?: string
		retrievalQuery?: string
	}
}

/**
 * AI configuration
 */
export type AiConfig = z.infer<typeof AiConfigSchema>

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>
export type ServerConfig = z.infer<typeof ServerConfigSchema>
export type PluginConfig = z.infer<typeof PluginConfigSchema>

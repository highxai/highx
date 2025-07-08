// Enum for compression levels
export enum CompressionEnum {
	default = -1,
	l1 = 1,
	l2 = 2,
	l3 = 3,
	l4 = 4,
	l5 = 5,
	l6 = 6,
	l7 = 7,
	l8 = 8,
	l9 = 9,
}

// Interface for HTTP server settings
export interface HttpConfig {
	port: number // Integer between 1 and 65535
	host: string // Non-empty string
	ssl?: {
		enabled: boolean
		certPath: string // Non-empty string
		keyPath: string // Non-empty string
	}
	compression?: {
		enabled: boolean
		level?: CompressionEnum // Optional compression level
	}
}

// Interface for static file serving
export interface StaticConfig {
	root: string // Non-empty string
	index?: string // Optional non-empty string
	notFound?: string // Optional non-empty string, defaults to './public/404.html'
	serverError?: string // Optional non-empty string
	cache?: {
		enabled: boolean
		maxAge: number // Non-negative integer
	}
}

// Interface for route handlers
export interface RouteHandler {
	type: 'static' | 'proxy' | 'custom'
	static?: {
		filePath: string // Non-empty string
		cacheControl?: string
	}
	proxy?: {
		target: string // Valid URL
		rewrite?: string
	}
	custom?: {
		handlerPath: string // Non-empty string
		handlerName: string // Non-empty string
	}
	// Constraint: Exactly one of static, proxy, or custom must be defined
}

// Interface for route configuration
export interface RouteConfig {
	path: string // Non-empty string
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL'
	handler: RouteHandler
}

// Interface for proxy configuration
export interface ProxyConfig {
	name: string // Non-empty string
	upstream: {
		servers: string[] // At least one valid URL
		strategy: 'round-robin' | 'least-connections' | 'ip-hash'
	}
	healthCheck?: {
		enabled: boolean
		interval: number // Minimum 1000 (1 second)
		path: string // Non-empty string
	}
}

// Types for plugin configuration
export type PluginProvidedConfigDataTypes = string | number | boolean | null
export type PluginProvidedConfig = Record<
	string,
	PluginProvidedConfigDataTypes | Record<string, PluginProvidedConfigDataTypes>
>
export interface PluginConfig {
	name: string // Non-empty string
	modulePath: string // Non-empty string
	hookOn: ('start' | 'invoke' | 'end')[]
	config: PluginProvidedConfig
	enabled: boolean
}

// Interface for the entire server configuration
export interface ServerConfig {
	http: HttpConfig
	static?: StaticConfig
	routes: RouteConfig[] // At least one route
	proxy?: ProxyConfig[]
	plugins?: PluginConfig[]
}

export type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

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

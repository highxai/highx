import { z } from 'zod/v4'

enum CompressionEnum {
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

// Zod schema for HTTP server settings
export const HttpConfigSchema = z.object({
	port: z.number().int().min(1).max(65535), // Valid port range
	host: z.string().nonempty(), // Non-empty host string
	ssl: z
		.object({
			enabled: z.boolean(),
			certPath: z.string().nonempty(),
			keyPath: z.string().nonempty(),
		})
		.optional(),
	compression: z
		.object({
			enabled: z.boolean(),
			//   level: z.number().int().min(1).max(9).optional(), // Gzip compression level
			level: z.enum(CompressionEnum).optional(), // Gzip compression level
		})
		.optional(),
})

// Zod schema for static file serving
export const StaticConfigSchema = z
	.object({
		root: z.string().nonempty(), // Root directory path
		index: z.string().nonempty().optional(), // Default index file
		notFound: z.string().nonempty().optional().default('./public/404.html'), // Default index file
		serverError: z.string().nonempty().optional(), // Default index file
		cache: z
			.object({
				enabled: z.boolean(),
				maxAge: z.number().int().nonnegative(), // Cache max-age in seconds
			})
			.optional(),
	})
	.optional()

// Zod schema for route handlers
export const RouteHandlerSchema = z
	.object({
		type: z.enum(['static', 'proxy', 'custom']),
		static: z
			.object({
				filePath: z.string().nonempty(),
				cacheControl: z.string().optional(),
			})
			.optional(),
		proxy: z
			.object({
				target: z.string().url(), // Valid URL for proxy target
				rewrite: z.string().optional(), // Optional rewrite rule
			})
			.optional(),
		custom: z
			.object({
				handlerPath: z.string().nonempty(),
				handlerName: z.string().nonempty(),
			})
			.optional(),
	})
	.refine(
		(data) => {
			// Ensure exactly one handler type is defined
			const definedHandlers = [data.static, data.proxy, data.custom].filter(
				(h) => h !== undefined,
			)
			return definedHandlers.length === 1
		},
		{
			message:
				'Exactly one of static, proxy, or custom handler must be defined',
			path: ['handler'],
		},
	)

// Zod schema for route configuration
export const RouteSchema = z.object({
	path: z.string().nonempty(), // Non-empty path (supports regex)
	method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL']),
	handler: RouteHandlerSchema,
})

// Zod schema for proxy configuration
export const ProxyConfigSchema = z.object({
	name: z.string().nonempty(), // Unique proxy name
	upstream: z.object({
		servers: z.array(z.string().url()).min(1), // At least one upstream server
		strategy: z.enum(['round-robin', 'least-connections', 'ip-hash']),
	}),
	healthCheck: z
		.object({
			enabled: z.boolean(),
			interval: z.number().int().min(1000), // Minimum 1 second interval
			path: z.string().nonempty(),
		})
		.optional(),
})

// Zod schema for plugin configuration
export const PluginConfigSchema = z.object({
	name: z.string().nonempty(), // Plugin name
	modulePath: z.string().nonempty(), // Path to plugin module
	config: z.record(
		z.string(),
		z.string().or(z.number()).or(z.boolean()).or(z.null()),
	),
	enabled: z.boolean(),
})

// Zod schema for the entire server configuration
const ServerConfigSchema = z.object({
	http: HttpConfigSchema,
	static: StaticConfigSchema,
	routes: z.array(RouteSchema).min(1), // At least one route
	proxy: z.array(ProxyConfigSchema).optional(),
	plugins: z.array(PluginConfigSchema).optional(),
})

// Export the schema for use in validation
export default ServerConfigSchema

export type ServerConfig = z.infer<typeof ServerConfigSchema>

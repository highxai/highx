import type { ServerConfig } from './types'

// Example configuration for the server
const config: ServerConfig = {
	http: {
		port: 8080,
		host: '0.0.0.0',
		ssl: {
			enabled: false,
			certPath: '/path/to/cert.pem',
			keyPath: '/path/to/key.pem',
		},
		compression: {
			enabled: true,
			//   enabled: false,
			level: 6,
		},
	},

	static: {
		root: './public',
		index: 'index.html',
		notFound: '404.html',
		cache: {
			//   enabled: true,
			enabled: false,
			maxAge: 3600, // 1 hour
		},
	},

	routes: [
		{
			path: '/default',
			method: 'GET',
			handler: {
				type: 'static',
				static: {
					filePath: './public/index.html',
					cacheControl: 'public, max-age=3600',
				},
			},
		},
		{
			path: '/(.*)',
			method: 'ALL',
			handler: {
				type: 'proxy',
				proxy: {
					target: 'http://localhost:3000',
					rewrite: '^/api/(.*)$ /$1',
				},
			},
		},
		{
			path: '/api/(.*)',
			method: 'ALL',
			handler: {
				type: 'proxy',
				proxy: {
					target: 'http://localhost:3000',
					rewrite: '^/api/(.*)$ /$1',
				},
			},
		},
		// {
		// 	path: '/api/(.*)',
		// 	method: 'ALL',
		// 	handler: {
		// 		type: 'proxy',
		// 		proxy: {
		// 			target: 'http://localhost:3000',
		// 			rewrite: '^/api/(.*)$ /$1',
		// 		},
		// 	},
		// },
		// {
		//   path: '/custom',
		//   method: 'POST',
		//   handler: {
		//     type: 'custom',
		//     custom: {
		//       handlerPath: './handlers/customHandler.ts',
		//       handlerName: 'handleCustomRequest',
		//     },
		//   },
		// },
	],

	//   proxy: [
	//     {
	//       name: 'api-backend',
	//       upstream: {
	//         servers: ['http://localhost:3000', 'http://localhost:3001'],
	//         strategy: 'round-robin',
	//       },
	//       healthCheck: {
	//         enabled: true,
	//         interval: 5000,
	//         path: '/health',
	//       },
	//     },
	//   ],

	// plugins: [
	// 	{
	// 		name: 'rate-limit',
	// 		modulePath: './plugins/rateLimitPlugin.ts',
	// 		config: {
	// 			requestsPerSecond: 100,
	// 			burst: 200,
	// 		},
	// 		enabled: true,
	// 	},
	// 	{
	// 		name: 'auth',
	// 		modulePath: './plugins/authPlugin.ts',
	// 		config: {
	// 			jwtSecret: 'your-secret-key',
	// 			authHeader: 'Authorization',
	// 		},
	// 		enabled: true,
	// 	},
	// ],
}

// Export the configuration
export default config

import { describe, expect, it } from 'bun:test'
import { RoundRobinBalancer } from '../src/utils/roundRobinBalancer'

describe('RoundRobinBalancer', () => {
	it('should rotate servers in round-robin order', () => {
		const balancer = new RoundRobinBalancer(['server1', 'server2', 'server3'])
		expect(balancer.next()).toBe('server1')
		expect(balancer.next()).toBe('server2')
		expect(balancer.next()).toBe('server3')
		expect(balancer.next()).toBe('server1')
	})
})

// describe('startServer config validation', () => {
// 	it('should fail with invalid config', async () => {
// 		const originalExit = process.exit
// 		const mockExit = mock(() => {})
// 		// @ts-expect-error: override exit
// 		process.exit = mockExit
// 		const config = (await import('../server.config')).default
// 		const ServerConfigSchema = (await import('../validations/config')).default

// 		// Invalidate config temporarily
// 		const result = ServerConfigSchema.safeParse({})
// 		expect(result.success).toBe(false)

// 		// Restore
// 		process.exit = originalExit
// 	})
// })

// describe('Plugin middleware', () => {
// 	it('should load enabled plugins and skip disabled ones', async () => {
// 		const fakePlugin = {
// 			name: 'TestPlugin',
// 			enabled: true,
// 			modulePath: '../__mocks__/testPlugin.js',
// 			config: { key: 'value' },
// 		}

// 		const validatedConfig = {
// 			http: { port: 8080, host: 'localhost' },
// 			plugins: [fakePlugin],
// 			routes: [],
// 			proxy: [],
// 		}

// 		const fakePluginMiddleware = async (req: Request) => {
// 			return new Response('Plugin Response')
// 		}

// 		// Mock import to simulate plugin load
// 		const dynamicImport = async (path: string) => {
// 			return {
// 				default: fakePluginMiddleware,
// 			}
// 		}

// 		const pluginModule = await dynamicImport(fakePlugin.modulePath)
// 		expect(pluginModule.default).toBeInstanceOf(Function)
// 	})
// })

import path from 'node:path'
import type { HandlerContext, ServerConfig } from '../types'
import type { RoundRobinBalancer } from './roundRobinBalancer'

/**
 * Handles static, proxy, and custom routes based on configuration.
 * @param req Incoming request
 * @param config Server configuration
 * @param balancers Load balancer map for proxies
 * @returns Response if matched, otherwise undefined
 */
export async function handleRoutes(
	req: Request,
	config: ServerConfig,
	context: HandlerContext,
	balancers: Map<string, RoundRobinBalancer>,
): Promise<Response | undefined> {
	const url = new URL(req.url)

	for (const route of config.routes) {
		const methodMatch = route.method === 'ALL' || route.method === req.method
		const pathMatch = new RegExp(`^${route.path}$`).test(url.pathname)
		if (!methodMatch || !pathMatch) continue

		switch (route.handler.type) {
			case 'static': {
				const filePath = path.resolve(route.handler.static!.filePath)
				const file = Bun.file(filePath)
				const headers = new Headers({
					'Content-Type': file.type,
					'X-Powered-By': 'HighX',
				})
				if (route.handler.static?.cacheControl) {
					headers.set('Cache-Control', route.handler.static.cacheControl)
				}
				if (config.http.compression?.enabled) {
					headers.set('Content-Encoding', 'gzip')
					const gzipped = Bun.gzipSync(await file.text(), {
						level: config.http.compression.level || -1,
					})
					return new Response(gzipped, { headers })
				}
				return new Response(file, { headers })
			}

			case 'proxy': {
				const proxyTarget = route.handler.proxy?.target
				const proxy = config.proxy?.find((p) => p.name === proxyTarget)
				const balancerFromMap = balancers.get(proxy?.upstream.strategy || '')
				const upstream = balancerFromMap?.next() || route.handler.proxy?.target
				let targetUrl = upstream + url.pathname

				if (route.handler.proxy?.rewrite) {
					const [pattern, replacement] = route.handler.proxy.rewrite.split(' ')
					targetUrl =
						upstream + url.pathname.replace(new RegExp(pattern), replacement)
				}

				try {
					const proxyResponse = await fetch(targetUrl, {
						method: req.method,
						headers: req.headers,
						body: req.body,
					})
					const resHeaders = new Headers(proxyResponse.headers)
					resHeaders.set('x-powered-by', 'HighX')
					resHeaders.set('HighX-Version', '0.1.1')
					return new Response(proxyResponse.body, {
						status: proxyResponse.status,
						headers: resHeaders,
					})
				} catch {
					return new Response('Proxy error', { status: 500 })
				}
			}

			case 'custom': {
				try {
					const handlerModule = await import(route.handler.custom!.handlerPath)
					const handler = handlerModule[route.handler.custom!.handlerName]
					const result = await handler(req)
					return result instanceof Response
						? result
						: new Response('Invalid handler response', { status: 500 })
				} catch (err) {
					return new Response(`Custom handler error: ${err}`, { status: 500 })
				}
			}
		}
	}
	return undefined
}

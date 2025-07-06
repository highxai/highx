import type { ProxyConfig } from '../types'
import type { RoundRobinBalancer } from './roundRobinBalancer'

/**
 * Runs periodic health checks on proxy upstreams.
 */
export function runHealthChecks(
	proxies: ProxyConfig[],
	balancers: Map<string, RoundRobinBalancer>,
): void {
	for (const proxyConfig of proxies) {
		if (!proxyConfig.healthCheck?.enabled) continue
		setInterval(async () => {
			const balancer = balancers.get(proxyConfig.name)
			if (!balancer) return
			const server = balancer.next()
			try {
				const res = await fetch(`${server}${proxyConfig.healthCheck?.path}`)
				console.log(`Health check for ${server}: ${res.status}`)
			} catch (err) {
				console.error(`Health check failed for ${server}:`, err)
			}
		}, proxyConfig.healthCheck.interval)
	}
}

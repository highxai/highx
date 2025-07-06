/**
 * A simple round-robin load balancer for cycling through upstream servers.
 */
export class RoundRobinBalancer {
	private servers: string[]
	private current: number

	constructor(servers: string[]) {
		this.servers = servers
		this.current = 0
	}

	/**
	 * Returns the next server in the round-robin cycle.
	 */
	next(): string {
		const server = this.servers[this.current]
		this.current = (this.current + 1) % this.servers.length
		return server
	}
}

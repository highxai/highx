import type { ServerConfig } from '../types'

/** Serves static file from root with compression and caching */
export async function serveStaticFallback(
	req: Request,
	config: ServerConfig,
): Promise<Response | undefined> {
	const url = new URL(req.url)
	const filePath = `${config.static?.root}${url.pathname === '/' ? `/${config.static?.index}` : url.pathname}`
	const file = Bun.file(filePath)

	if (!(await file.exists())) return undefined

	const headers = new Headers({
		'Content-Type': file.type,
		'X-Powered-By': 'HighX',
	})
	if (config.static?.cache?.enabled) {
		headers.set(
			'Cache-Control',
			`public, max-age=${config.static.cache.maxAge}`,
		)
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

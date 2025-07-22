import type { Stats } from 'node:fs'
import { stat } from 'node:fs/promises'

type FileSystemEntityType = 'file' | 'directory' | 'none'

interface PathCheckResult {
	exists: boolean
	type: FileSystemEntityType
	stats?: Stats
}

export async function checkPath(path: string): Promise<PathCheckResult> {
	try {
		const stats = await stat(path)

		if (stats.isFile()) {
			return { exists: true, type: 'file', stats }
		}

		if (stats.isDirectory()) {
			return { exists: true, type: 'directory', stats }
		}

		return { exists: true, type: 'none', stats } // fallback if neither
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
			return { exists: false, type: 'none' }
		}
		throw err // propagate other unexpected errors
	}
}

import path from 'node:path'
import type { Context, ParsedCommand } from './types'

export const getTemplate = async (
	name:
		| 'package.json'
		| 'highx.config.ts'
		| 'plugin.ai.ts'
		| 'plugin.config.ts',
): Promise<string> => {
	const template = Bun.file(
		path.resolve(import.meta.dir, '../', `./templates/${name}.txt`),
	)

	const content = await template.text()
	return content.replaceAll('<PROJECT_NAME>', name)
}

export function parseArgs(argv: string[]): ParsedCommand | null {
	const args = argv.slice(2) // Skip 'bun' and script path
	if (args.length === 0) return null

	const [command, maybeTypeOrParam, ...rest] = args

	const options: Record<string, string | boolean> = {}
	const params: string[] = []

	for (const item of rest) {
		if (item.startsWith('--')) {
			const [key, value] = item.slice(2).split('=')
			options[key] = value !== undefined ? value : true
		} else {
			params.push(item)
		}
	}

	const isType = maybeTypeOrParam && !maybeTypeOrParam.startsWith('--')
	const type = isType ? maybeTypeOrParam : undefined
	const paramList = isType
		? params
		: [maybeTypeOrParam, ...params].filter(Boolean)

	return {
		command,
		...(type ? { type } : {}),
		params: paramList,
		options,
	}
}

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms))

export const generateCtx = (cmd: ParsedCommand): Context => {
	const currentPath = process.cwd()

	return {
		currentPath,
		type: cmd.type,
		params: cmd.params,
		options: cmd.options,
	}
}

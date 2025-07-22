import type { ReactNode } from 'react'

export interface Context {
	currentPath: string
	type?: string
	params: string[]
	options: Record<string, string | boolean>
}

export type Command = {
	name: string
	description: string
	options?: string[]
	cmp: (ctx: Context) => ReactNode
}

export interface CLIMessage {
	type: 'success' | 'error' | 'info'
	text: string
}

export type ParsedCommand = {
	command: string
	type?: string
	params: string[]
	options: Record<string, string | boolean>
}

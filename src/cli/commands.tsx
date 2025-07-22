import React from 'react'
import CommandHelp from './commands/help'
import CommandInit from './commands/init'
import CommandList from './commands/list'
import CommandNew from './commands/new'
import type { Command } from './types'

export const commands: Command[] = [
	{
		name: 'init',
		description:
			'Initialize a new HighX project. Defaults to "highx-project" if no name is provided.',
		cmp: (ctx) => <CommandInit {...ctx} />,
	},
	{
		name: 'new',
		description: 'Create a new plugin or module for your HighX project.',
		cmp: (ctx) => <CommandNew {...ctx} />,
	},
	{
		name: 'list',
		description: 'List all available plugins, modules, or project components.',
		cmp: (ctx) => <CommandList {...ctx} />,
	},
	{
		name: 'help',
		description: 'Show usage info and available command options.',
		options: ['--plugin : Show details about a specific plugin command'],
		cmp: (ctx) => <CommandHelp />,
	},
]

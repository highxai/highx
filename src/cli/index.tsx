import { Box, render, Text } from 'ink'
import React, { type ReactNode } from 'react'
import { commands } from './commands'
import CommandHelp from './commands/help'
import { HighXLogo } from './components/brand'
import type { ParsedCommand } from './types'
import { generateCtx, parseArgs } from './utils'

const App = (): ReactNode => {
	let result: ParsedCommand | null
	try {
		result = parseArgs(Bun.argv)
	} catch (error) {
		return (
			<Box
				flexDirection="column"
				padding={1}
				borderStyle="round"
				borderColor="redBright"
			>
				<HighXLogo version />
				<Box marginY={1} flexDirection="column">
					<Text color="redBright" bold>
						Error: Failed to parse command arguments
					</Text>
					<Text color="gray">
						Please ensure the command is valid and try again.
					</Text>
					<Text color="cyan">
						Run <Text bold>highx --help</Text> for available commands and
						options.
					</Text>
					<Text color="yellowBright">
						Check documentation at{' '}
						<Text bold>https://highx.dev/docs/command?utm=cli</Text>
					</Text>
				</Box>
			</Box>
		)
	}

	if (!result?.command) {
		return <CommandHelp />
	}

	const command = commands.find((cmd) => cmd.name === result.command)
	if (!command) {
		return (
			<Box
				flexDirection="column"
				padding={1}
				borderStyle="round"
				borderColor="redBright"
			>
				<HighXLogo version />
				<Box marginY={1} flexDirection="column">
					<Text color="redBright" bold>
						Error: Invalid command '{result.command}'
					</Text>
					<Text color="gray">The specified command is not recognized.</Text>
					<Text color="cyan">
						Run <Text bold>highx help</Text> for a list of available commands.
					</Text>
					<Text color="yellowBright">
						Check documentation at{' '}
						<Text bold>https://highx.dev/docs/command?utm=cli</Text>
					</Text>
				</Box>
			</Box>
		)
	}

	const ctx = generateCtx(result)
	return (
		<Box
			flexDirection="column"
			padding={1}
			borderStyle="round"
			borderColor="cyan"
		>
			{command.cmp(ctx)}
		</Box>
	)
}

render(<App />)

import path from 'node:path'
import { parseArgs } from 'node:util'
import gradient from 'gradient-string'
import { Box, render, Text, useApp, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import React, { type ReactNode, useEffect, useState } from 'react'
import packageJson from '../package.json'

type Command = {
	name: string
	description: string
}

const commands: Command[] = [
	{
		name: 'start',
		description: 'Starts the server with the provided configuration',
	},
	{
		name: 'healthcheck',
		description: 'Runs a health check against the server',
	},
	{ name: 'stop', description: 'Stops the server gracefully' },
	{ name: 'status', description: 'Checks the current status of the server' },
	{ name: 'restart', description: 'Restarts the server' },
	{ name: 'config', description: 'Displays the current configuration' },
	{ name: 'plugins', description: 'Lists available plugins and their status' },
	{ name: 'logs', description: 'Displays server logs' },
	{
		name: 'version',
		description: 'Displays the current version of the HighX server',
	},
	{ name: 'help', description: 'Displays help information for CLI commands' },
	{
		name: 'init',
		description: 'Initializes a new HighX project with default configuration',
	},
	{
		name: 'update',
		description: 'Updates the HighX server to the latest version',
	},
	{
		name: 'backup',
		description:
			'Creates a backup of the current server configuration and data',
	},
	{ name: 'restore', description: 'Restores the server from a backup' },
	{
		name: 'metrics',
		description:
			'Displays server metrics such as request count, response time, etc',
	},
	{ name: 'debug', description: 'Enables debug mode for more verbose logging' },
	{
		name: 'test',
		description: 'Runs tests against the server configuration and routes',
	},
	{
		name: 'generate',
		description:
			'Generates code snippets or configuration files based on templates',
	},
	{
		name: 'shell',
		description: 'Opens an interactive shell for server management',
	},
	{
		name: 'info',
		description:
			'Displays detailed info about the server, plugins, and configuration',
	},
	{
		name: 'migrate',
		description: 'Migrates the server to a new version or configuration format',
	},
]

export const HighXLogo = ({ version }: { version?: boolean }): ReactNode => {
	const gradientText = gradient(['#60a5fa', '#a78bfa'])('HighX')
	return (
		<>
			<Text>{gradientText}</Text>
			{version && <Text color="gray">Version: {packageJson.version}</Text>}
		</>
	)
}

const SelectableCommandList = (): ReactNode => {
	const { exit } = useApp()

	const handleSelect = (item: Command): void => {
		render(<InlineCommands command={item.name} args={[]} />)
		exit()
	}

	const items = commands.map((cmd) => ({
		key: cmd.name,
		label: `${cmd.name.padEnd(15)} ${cmd.description}`,
		value: cmd,
	}))

	return (
		<SelectInput
			items={items}
			onSelect={(item): void => handleSelect(item.value)}
		/>
	)
}

const Help = (): ReactNode => {
	const { exit } = useApp()
	useInput((input) => {
		if (input === 'q') exit()
	})

	return (
		<Box flexDirection="column" padding={1}>
			<HighXLogo version />
			<Box marginY={1}>
				<Text>Usage: </Text>
				<Text color="yellow">highx {'<command>'} [options]</Text>
			</Box>

			<Text bold color="white">
				Available Commands:
			</Text>
			<SelectableCommandList />

			<Box marginTop={1} flexDirection="column">
				<Text bold color="white">
					Options:
				</Text>
				<Text>
					<Text color="cyan"> -c, --config {'<path>'}</Text>{' '}
					<Text color="gray">Specify the configuration file path</Text>
				</Text>
				<Text>
					<Text color="cyan"> -h, --help</Text>{' '}
					<Text color="gray">Display this help message</Text>
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>Press </Text>
				<Text color="magentaBright" bold>
					q
				</Text>
				<Text dimColor> to quit.</Text>
			</Box>
		</Box>
	)
}

const getTemplate = async (
	name: 'package.json' | 'highx.config.ts',
): Promise<string> => {
	const template = Bun.file(
		path.resolve(import.meta.dir, `./templates/${name}.txt`),
	)

	const content = await template.text()
	return content.replaceAll('<PROJECT_NAME>', name)
}

const InitProject = ({ name }: { name: string }): ReactNode => {
	const [loading, setLoading] = useState(true)
	const [gitError, setGitError] = useState<string | null>(null)

	useEffect(() => {
		const init = async (): Promise<void> => {
			const [confTemplate, packageTemplate] = await Promise.all([
				await getTemplate('highx.config.ts'),
				await getTemplate('package.json'),
			])

			await Promise.all([
				await Bun.write(`${name}/highx.config.ts`, confTemplate, {
					createPath: true,
				}),
				await (async () => {
					Bun.write(`${name}/package.json`, packageTemplate, {
						createPath: true,
					})
				})(),
			])

			const currentCLIPath = path.resolve(process.cwd(), name)
			const gitProcess = Bun.spawn(['git', 'init'], {
				cwd: currentCLIPath,
			})
			const gitExitCode = await gitProcess.exited

			if (gitExitCode !== 0) {
				setGitError(
					'Failed to initialize Git repository. Ensure Git is installed and try again.',
				)
			}

			setLoading(false)
		}

		init()
	}, [name])

	if (loading) {
		return <Text color={'magentaBright'}>Initializing project '{name}'...</Text>
	}

	return (
		<Box flexDirection="column">
			<Text color="magentaBright">
				🟢 Project '{name}' created successfully!
			</Text>
			<Text>
				- Navigate to your project: <Text bold>cd {name}</Text>
			</Text>
			<Text>
				- Install dependencies: <Text bold>bun install</Text>
			</Text>
			<Text color="greenBright">
				- Customize your setup in <Text bold>highx.config.ts</Text>
			</Text>
			{!gitError && <Text color="cyan">- Git repository initialized</Text>}
			{gitError && <Text color="redBright">{gitError}</Text>}
			<Text color="yellowBright">
				- For more info check documentation{' '}
				<Text bold>https://highx.dev/docs?ref=cli</Text>
			</Text>

			<Text>
				-- Enjoy building AI apps with <HighXLogo /> --
			</Text>
		</Box>
	)
}

// Command handlers
const commandHandlers: Record<
	string,
	({ args }: { args: string[] }) => ReactNode | null
> = {
	start: ({ args }) => {
		if (!args.length) {
		}

		return <Text>Starting server with config: {args.join(' ') || 'none'}</Text>
	},
	healthcheck: () => <Text>Running health check...</Text>,
	stop: () => <Text>Stopping server gracefully...</Text>,
	status: () => <Text>Server status: Running</Text>,
	restart: () => <Text>Restarting server...</Text>,
	config: ({ args }) => (
		<Text>Displaying configuration from {args[0] || 'default config'}</Text>
	),
	plugins: () => <Text>Listing plugins: [plugin1, plugin2, plugin3]</Text>,
	logs: ({ args }) => <Text>Displaying logs for {args[0] || 'latest'}</Text>,
	version: () => <Text>{packageJson.version}</Text>,
	help: () => <Help />,
	init: ({ args }) => {
		return <InitProject name={args[0] || 'highx-project'} />
	},
	update: () => <Text>Updating HighX server to the latest version...</Text>,
	backup: ({ args }) => (
		<Text>Creating backup to {args[0] || 'backup.tar.gz'}</Text>
	),
	restore: ({ args }) => (
		<Text>Restoring from {args[0] || 'latest backup'}</Text>
	),
	metrics: () => (
		<Text>Server metrics: 100 requests, 50ms avg response time</Text>
	),
	debug: () => <Text>Enabling debug mode...</Text>,
	test: () => <Text>Running tests against server configuration...</Text>,
	generate: ({ args }) => <Text>Generating {args[0] || 'template'}...</Text>,
	shell: () => <Text>Opening interactive shell...</Text>,
	info: () => <Text>Server info: HighX v{packageJson.version}, 3 plugins</Text>,
	export: ({ args }) => (
		<Text>Exporting configuration to {args[0] || 'config.json'}</Text>
	),
	import: ({ args }) => (
		<Text>Importing configuration from {args[0] || 'config.json'}</Text>
	),
	migrate: () => <Text>Migrating server to new version...</Text>,
}

const InlineCommands = ({
	command,
	args,
}: {
	command: string
	args: string[]
}): ReactNode => {
	const handler = commandHandlers[command]

	useEffect(() => {
		if (!handler) {
			process.exit(1)
		}
	}, [handler])

	if (!handler) {
		return (
			<Text color="redBright">
				Unknown command '{command}'. Run `highx help` for available commands.
			</Text>
		)
	}
	return <Box padding={1}>{handler({ args })}</Box>
}

const convertToCommands = (
	cmds: string[],
): { command: string; args: string[] } | null => {
	if (cmds.length === 0) return null
	const [commandName, ...args] = cmds
	return { command: commandName, args }
}

const App = (): ReactNode => {
	const { values, positionals } = parseArgs({
		args: Bun.argv.slice(2),
		tokens: true,
		options: {
			c: { type: 'boolean' },
			config: { type: 'string' },
			help: { type: 'boolean' },
		},
		strict: true,
		allowPositionals: true,
	})
	const parsed = convertToCommands(positionals)

	if (values.help || !parsed) return <Help />

	return <InlineCommands command={parsed.command} args={parsed.args} />
}

render(<App />)

import path from 'node:path'
import packageJson from '../package.json'
import { startServer } from './server'
import type { ServerConfig } from './types'
import { loadHighXConfig } from './utils/config'

interface Command {
	name: string
	description: string
	handler: (args: string[], config: ServerConfig) => Promise<void>
}

const commands: Command[] = [
	{
		name: 'start',
		description: 'Starts the server with the provided configuration',
		handler: async (args: string[], config: ServerConfig) => {
			await startServer(config)
		},
	},
	{
		name: 'healthcheck',
		description: 'Runs a health check against the server',
		handler: async (args: string[], config: ServerConfig) => {
			try {
				const result = await fetch(
					`http://${config.http.host}:${config.http.port}/health`,
				)
				if (result.ok) {
					console.log('Health check passed')
				} else {
					console.error('Health check failed:', result.statusText)
					process.exit(1)
				}
			} catch (error) {
				console.error('Error during health check:', error)
				process.exit(1)
			}
		},
	},
	{
		name: 'stop',
		description: 'Stops the server gracefully',
		handler: async () => {
			console.log('Stop command coming soon')
		},
	},
	{
		name: 'status',
		description: 'Checks the current status of the server',
		handler: async () => {
			console.log('Status command coming soon')
		},
	},
	{
		name: 'restart',
		description: 'Restarts the server',
		handler: async () => {
			console.log('Restart command coming soon')
		},
	},
	{
		name: 'config',
		description: 'Displays the current configuration',
		handler: async () => {
			console.log('Config command coming soon')
		},
	},
	{
		name: 'plugins',
		description: 'Lists available plugins and their status',
		handler: async () => {
			console.log('Plugins command coming soon')
		},
	},
	{
		name: 'logs',
		description: 'Displays server logs',
		handler: async () => {
			console.log('Logs command coming soon')
		},
	},
	{
		name: 'version',
		description: 'Displays the current version of the HighX server',
		handler: async () => {
			console.log('Version command coming soon')
		},
	},
	{
		name: 'help',
		description: 'Displays help information for CLI commands',
		handler: async () => {
			printHelp()
		},
	},
	{
		name: 'init',
		description: 'Initializes a new HighX project with default configuration',
		handler: async (args) => {
			console.log('Initializing HighX project...')
			console.log(args)
			const configTemplate = await Bun.file(
				path.join(import.meta.dirname, './templates/default.config.txt'),
			).text()
			// Bun.write(path.join(filePath, 'highx.config.ts'), configTemplate);
			await Bun.write('highx.config.ts', configTemplate)
			// console.log(`Initialized HighX project at ${filePath}`);
			console.log(
				'You can now edit the configuration file and start the server with "highx start -c highx.config.ts"',
			)
		},
	},
	{
		name: 'update',
		description: 'Updates the HighX server to the latest version',
		handler: async () => {
			console.log('Update command coming soon')
		},
	},
	{
		name: 'backup',
		description:
			'Creates a backup of the current server configuration and data',
		handler: async () => {
			console.log('Backup command coming soon')
		},
	},
	{
		name: 'restore',
		description: 'Restores the server from a backup',
		handler: async () => {
			console.log('Restore command coming soon')
		},
	},
	{
		name: 'metrics',
		description:
			'Displays server metrics such as request count, response time, etc',
		handler: async () => {
			console.log('Metrics command coming soon')
		},
	},
	{
		name: 'debug',
		description: 'Enables debug mode for more verbose logging',
		handler: async () => {
			console.log('Debug command coming soon')
		},
	},
	{
		name: 'test',
		description: 'Runs tests against the server configuration and routes',
		handler: async () => {
			console.log('Test command coming soon')
		},
	},
	{
		name: 'generate',
		description:
			'Generates code snippets or configuration files based on templates',
		handler: async () => {
			console.log('Generate command coming soon')
		},
	},
	{
		name: 'shell',
		description: 'Opens an interactive shell for server management',
		handler: async () => {
			console.log('Shell command coming soon')
		},
	},
	{
		name: 'info',
		description:
			'Displays detailed information about the server, plugins, and configuration',
		handler: async () => {
			console.log('Info command coming soon')
		},
	},
	{
		name: 'export',
		description: 'Exports the current configuration to a file',
		handler: async () => {
			console.log('Export command coming soon')
		},
	},
	{
		name: 'import',
		description: 'Imports a configuration from a file',
		handler: async () => {
			console.log('Import command coming soon')
		},
	},
	{
		name: 'migrate',
		description: 'Migrates the server to a new version or configuration format',
		handler: async () => {
			console.log('Migrate command coming soon')
		},
	},
]

const printHelp = () => {
	const version = packageJson.version
	console.log(`HighX CLI - Command Line Interface. Version: ${version}\n`)
	console.log('Usage: highx <command> [options]\n')
	console.log('Available commands:')

	for (const cmd of commands) {
		console.log(`  ${cmd.name.padEnd(15)} ${cmd.description}`)
	}
	console.log('\nOptions:')
	console.log('  -c, --config <path>  Specify the configuration file path')
	console.log('  -h, --help          Display this help message')
}

const parseArgs = (args: string[]) => {
	const parsed: { command?: string; configPath?: string } = {}
	const remainingArgs: string[] = []

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		if (arg === '-c' || arg === '--config') {
			if (i + 1 < args.length) {
				parsed.configPath = args[i + 1]
				i++
			}
		} else if (arg === '-h' || arg === '--help') {
			printHelp()
			process.exit(0)
		} else if (!parsed.command) {
			parsed.command = arg
		} else {
			remainingArgs.push(arg)
		}
	}

	return { parsed, remainingArgs }
}

const main = async () => {
	try {
		const args = Bun.argv.slice(2)
		const { parsed, remainingArgs } = parseArgs(args)

		if (!parsed.command) {
			printHelp()
			process.exit(1)
		}

		const configPath = parsed.configPath
		if (!configPath) {
			console.error(
				'Configuration file path is required. Use -c or --config to specify it.',
			)
			printHelp()
			process.exit(1)
		}
		const resolvedPath = path.resolve(configPath)
		const config = await loadHighXConfig(resolvedPath)
		console.log(`[highx conf]: ${resolvedPath}`)

		const command = commands.find((cmd) => cmd.name === parsed.command)
		if (!command) {
			console.error(`Unknown command: ${parsed.command}`)
			printHelp()
			process.exit(1)
		}

		await command.handler(remainingArgs, config)
	} catch (err) {
		console.error('Error in main execution:', err)
		process.exit(1)
	}
}

main()

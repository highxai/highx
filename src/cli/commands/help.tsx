import { Box, Text } from 'ink'
import React, { type ReactNode } from 'react'
import { commands } from '../commands'
import { HighXLogo } from '../components/brand'

const CommandHelp = (): ReactNode => {
	return (
		<Box
			flexDirection="column"
			padding={1}
			borderStyle="round"
			borderColor="cyan"
		>
			<HighXLogo version />
			<Box marginY={1} flexDirection="column">
				<Text bold color="white">
					Usage:
				</Text>
				<Text>
					<Text color="yellow">highx {'<command>'}</Text>
					<Text color="gray"> [options]</Text>
				</Text>
			</Box>

			<Box flexDirection="column" marginY={1}>
				<Text bold color="white">
					Available Commands:
				</Text>
				{commands.length === 0 ? (
					<Text color="redBright">No commands available.</Text>
				) : (
					commands.map((cmd) => (
						<Box key={cmd.name} marginLeft={2} flexDirection="column">
							<Text>
								<Text color="cyan" bold>
									{cmd.name}
								</Text>
								<Text color="gray"> - {cmd.description}</Text>
							</Text>
							{cmd.options && cmd.options.length > 0 && (
								<Box marginLeft={2} flexDirection="column">
									<Text dimColor>Options:</Text>
									{cmd.options.map((opt, index) => {
										const [flag, description = ''] = opt.split(':')

										return (
											<Text key={`${cmd.name}-opt-${index}`}>
												<Text color="cyan">{flag}</Text>
												<Text color="gray"> - {description}</Text>
											</Text>
										)
									})}
								</Box>
							)}
						</Box>
					))
				)}
			</Box>

			<Box flexDirection="column" marginY={1}>
				<Text bold color="white">
					Global Options:
				</Text>
				<Box marginLeft={2} flexDirection="column">
					<Text>
						<Text color="cyan"> -c, --config {'<path>'}</Text>
						<Text color="gray"> - Specify the configuration file path</Text>
					</Text>
					<Text>
						<Text color="cyan"> -h, --help</Text>
						<Text color="gray"> - Display this help message</Text>
					</Text>
				</Box>
			</Box>

			<Box marginTop={1}>
				<Text dimColor>For more info visit </Text>
				<Text color="magentaBright" bold>
					https://highx.dev/docs?utm=cli
				</Text>
			</Box>
		</Box>
	)
}

export default CommandHelp

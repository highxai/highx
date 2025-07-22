import path from 'node:path'
import { Box, Text, useApp } from 'ink'
import React, { useEffect, useState } from 'react'
import { HighXLogo } from '../components/brand'
import type { Context } from '../types'

interface Plugin {
	name: string
}

interface Message {
	type: 'success' | 'error' | 'info'
	text: string
}

const CommandList = (ctx: Context) => {
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'complete' | 'error'
	>('idle')
	const [plugins, setPlugins] = useState<Plugin[]>([])
	const [messages, setMessages] = useState<Message[]>([])
	const { exit } = useApp()

	useEffect(() => {
		const loadPlugins = async () => {
			setStatus('loading')
			setMessages([
				{ type: 'info', text: 'Loading plugins from highx.config.ts...' },
			])

			try {
				const filePath = path.resolve(process.cwd(), './highx.config.ts')
				let configFile: any

				try {
					configFile = await import(filePath)
				} catch (importError) {
					setMessages([
						{
							type: 'error',
							text: 'No project detected: highx.config.ts not found.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}

				if (
					!configFile?.default?.plugins ||
					!Array.isArray(configFile.default.plugins)
				) {
					setMessages([
						{
							type: 'error',
							text: 'No plugins found in highx.config.ts or invalid configuration.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}

				const loadedPlugins = configFile.default.plugins
				if (loadedPlugins.length === 0) {
					setMessages([
						{ type: 'info', text: 'No plugins installed in the project.' },
					])
					setStatus('complete')
					setPlugins([])
				} else {
					setPlugins(loadedPlugins)
					setMessages([
						{
							type: 'success',
							text: `Found ${loadedPlugins.length} installed plugin${loadedPlugins.length > 1 ? 's' : ''}.`,
						},
					])
					setStatus('complete')
				}

				setTimeout(() => exit(), 1000)
			} catch (error) {
				setMessages([
					{
						type: 'error',
						text: 'An unexpected error occurred while loading plugins.',
					},
				])
				setStatus('error')
				setTimeout(() => exit(), 1000)
			}
		}

		loadPlugins()
	}, [exit])

	const renderMessage = (msg: Message, index: number) => (
		<Text
			key={index}
			color={
				msg.type === 'error'
					? 'redBright'
					: msg.type === 'success'
						? 'greenBright'
						: 'cyan'
			}
		>
			{msg.text}
		</Text>
	)

	return (
		<Box
			flexDirection="column"
			// padding={1}
			// borderStyle="round"
			// borderColor={status === 'error' ? 'redBright' : 'cyan'}
		>
			<HighXLogo version />
			<Box marginY={1} flexDirection="column">
				{status === 'loading' && (
					<>
						<Text color="magentaBright">Loading Plugins...</Text>
						{messages.map(renderMessage)}
					</>
				)}
				{status === 'complete' && (
					<>
						<Text color="magentaBright" bold>
							Installed Plugins
						</Text>
						{messages.map(renderMessage)}
						{plugins.length > 0 && (
							<Box marginLeft={2} flexDirection="column">
								{plugins.map((p, i) => (
									<Text key={p.name}>
										<Text color="cyan">{i + 1}. </Text>
										<Text>{p.name}</Text>
									</Text>
								))}
							</Box>
						)}
					</>
				)}
				{status === 'error' && (
					<>
						<Text color="redBright" bold>
							Plugin Loading Failed
						</Text>
						{messages.map(renderMessage)}
						<Text color="cyan">
							Run <Text bold>highx --help</Text> for available commands and
							options.
						</Text>
						<Text color="yellowBright">
							Check documentation at{' '}
							<Text bold>https://highx.dev/docs/command?utm=cli</Text>
						</Text>
					</>
				)}
			</Box>
		</Box>
	)
}

export default CommandList

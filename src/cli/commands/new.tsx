import path from 'node:path'
import { Box, Text, useApp } from 'ink'
import React, { type ReactNode, useEffect, useState } from 'react'
import { HighXLogo } from '../components/brand'
import type { Context } from '../types'
import { getTemplate } from '../utils'

interface Message {
	type: 'success' | 'error' | 'info'
	text: string
}

const getPluginName = (ctx: Context): string => {
	return ctx?.type || 'highx-plugin'
}

const CommandNew = (ctx: Context): ReactNode => {
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'complete' | 'error'
	>('idle')
	const [messages, setMessages] = useState<Message[]>([])
	const [progress, setProgress] = useState(0)
	const { exit } = useApp()

	const name = getPluginName(ctx)
	const { currentPath } = ctx

	useEffect(() => {
		const createPlugin = async () => {
			setStatus('loading')
			setMessages([{ type: 'info', text: `Creating plugin '${name}'...` }])
			setProgress(0)

			try {
				// Validate plugin name
				const trimmedName = name.trim()
				if (!trimmedName || /[^a-zA-Z0-9-_]/.test(trimmedName)) {
					setMessages([
						{
							type: 'error',
							text: 'Invalid plugin name. Use alphanumeric characters, hyphens, or underscores only.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(10)

				// Check for config file
				const filePath = path.resolve(currentPath, './highx.config.ts')
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
				setProgress(30)

				if (
					!configFile?.default?.plugins ||
					!Array.isArray(configFile.default.plugins)
				) {
					setMessages([
						{
							type: 'error',
							text: 'Invalid HighX configuration: plugins array not found.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(40)

				// Check for duplicate plugin
				if (
					configFile.default.plugins.some(
						(p: { name: string }) => p.name === trimmedName,
					)
				) {
					setMessages([
						{
							type: 'error',
							text: `Plugin '${trimmedName}' already exists in highx.config.ts.`,
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(50)

				// Fetch templates
				let pluginTemplate: string, newPluginConfig: string
				try {
					;[pluginTemplate, newPluginConfig] = await Promise.all([
						getTemplate('plugin.ai.ts'),
						getTemplate('plugin.config.ts'),
					])
				} catch (templateError) {
					setMessages([
						{
							type: 'error',
							text: 'Failed to fetch templates. Check your network or template source.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(60)

				// Create plugin file
				const pluginPath = path.resolve(
					currentPath,
					'plugins',
					trimmedName,
					'index.ts',
				)
				try {
					await Bun.write(pluginPath, pluginTemplate, { createPath: true })
				} catch (writeError) {
					setMessages([
						{
							type: 'error',
							text: 'Failed to create plugin file. Check disk permissions or space.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(80)

				// Update config file
				try {
					let source = await Bun.file(filePath).text()
					const formattedPlugin = newPluginConfig.replaceAll(
						'<PLUGIN_NAME>',
						trimmedName,
					)
					source = source.replace(
						/(plugins:\s*\[\n?)/,
						`$1  ${formattedPlugin},\n`,
					)
					await Bun.write(filePath, source)
				} catch (configError) {
					setMessages([
						{
							type: 'error',
							text: 'Failed to update highx.config.ts. Check file permissions.',
						},
					])
					setStatus('error')
					setTimeout(() => exit(), 1000)
					return
				}
				setProgress(100)

				// Success state
				setMessages([
					{
						type: 'success',
						text: `🟢 Plugin '${trimmedName}' created successfully!`,
					},
					{
						type: 'info',
						text: `Plugin file created at: plugins/${trimmedName}/index.ts`,
					},
					{ type: 'info', text: `Plugin added to highx.config.ts` },
					{
						type: 'info',
						text: `Customize your plugin in plugins/${trimmedName}/index.ts`,
					},
					{
						type: 'info',
						text: `Check documentation at https://highx.dev/docs/plugins?utm=cli`,
					},
				])
				setStatus('complete')
				setTimeout(() => exit(), 1000)
			} catch (unexpectedError) {
				setMessages([
					{
						type: 'error',
						text: 'An unexpected error occurred while creating the plugin.',
					},
				])
				setStatus('error')
				setTimeout(() => exit(), 1000)
			}
		}

		createPlugin()
	}, [name, currentPath, exit])

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
			padding={1}
			borderStyle="round"
			borderColor={status === 'error' ? 'redBright' : 'cyan'}
		>
			<HighXLogo version />
			<Box marginY={1} flexDirection="column">
				{status === 'loading' && (
					<>
						<Text color="magentaBright">Creating Plugin...</Text>
						<Text color="yellowBright">Progress: [{progress}%]</Text>
						{messages.map(renderMessage)}
					</>
				)}
				{status === 'complete' && (
					<>
						<Text color="magentaBright" bold>
							Plugin Creation
						</Text>
						{messages.map(renderMessage)}
						<Text color="magentaBright">
							-- Enjoy building with <HighXLogo /> --
						</Text>
					</>
				)}
				{status === 'error' && (
					<>
						<Text color="redBright" bold>
							Plugin Creation Failed
						</Text>
						{messages.map(renderMessage)}
						<Text color="cyan">
							Run <Text bold>highx --help</Text> for available commands and
							options.
						</Text>
						<Text color="yellowBright">
							Check documentation at{' '}
							<Text bold>https://highx.dev/docs/plugins?utm=cli</Text>
						</Text>
					</>
				)}
			</Box>
		</Box>
	)
}

export default CommandNew

import path from 'node:path'
import { Box, Text, useApp } from 'ink'
import React, { type ReactNode, useEffect, useState } from 'react'
import { HighXLogo } from '../components/brand'
import { RenderMessage } from '../components/cli'
import type { CLIMessage, Context } from '../types'
import { getTemplate } from '../utils'
import { checkPath } from '../utils/exists'

const getProjectName = (ctx: Context): string => {
	return ctx?.type || 'highx-project'
}

const CommandInit = (ctx: Context): ReactNode => {
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'complete' | 'error'
	>('idle')
	const [messages, setMessages] = useState<CLIMessage[]>([])
	const [progress, setProgress] = useState(0)
	const { exit } = useApp()

	const name = getProjectName(ctx)
	const { currentPath } = ctx

	useEffect(() => {
		const init = async (): Promise<void> => {
			try {
				setStatus('loading')
				setMessages([
					{ type: 'info', text: `Initializing project '${name}'...` },
				])
				setProgress(0)

				// Check if dir/file already exists
				const isExist = await checkPath(name)
				if (isExist.exists) {
					setMessages([
						{
							type: 'error',
							text: `A resource already exists with name '${name}'. Try with a unique name.`,
						},
					])
					setStatus('error')
					return
				}
				setProgress(20)

				// Fetch templates
				let confTemplate: string | null, packageTemplate: string | null
				try {
					;[confTemplate, packageTemplate] = await Promise.all([
						getTemplate('highx.config.ts'),
						getTemplate('package.json'),
					])
				} catch (templateError) {
					setMessages([
						{
							type: 'error',
							text: 'Failed to fetch templates. Check your network or template source.',
						},
					])
					setStatus('error')
					return
				}
				setProgress(40)

				// Write files
				try {
					await Promise.all([
						Bun.write(`${name}/highx.config.ts`, confTemplate, {
							createPath: true,
						}),
						Bun.write(`${name}/package.json`, packageTemplate, {
							createPath: true,
						}),
					])
				} catch (writeError) {
					setMessages([
						{
							type: 'error',
							text: 'Failed to write project files. Check disk permissions or space.',
						},
					])
					setStatus('error')
					return
				}
				setProgress(60)

				// Initialize Git
				try {
					const currentCLIPath = path.resolve(currentPath, name)
					const gitProcess = Bun.spawn(['git', 'init'], { cwd: currentCLIPath })
					const gitExitCode = await gitProcess.exited

					if (gitExitCode !== 0) {
						setMessages([
							{
								type: 'error',
								text: 'Failed to initialize Git repository. Ensure Git is installed.',
							},
						])
						setStatus('error')
						return
					}
				} catch (gitError) {
					setMessages([
						{
							type: 'error',
							text: 'Git initialization failed. Ensure Git is installed and accessible.',
						},
					])
					setStatus('error')
					return
				}
				setProgress(80)

				// Final success state
				setMessages([
					{
						type: 'success',
						text: `🟢 Project '${name}' created successfully!`,
					},
					{ type: 'info', text: `- Navigate to your project: cd ${name}` },
					{ type: 'info', text: `- Install dependencies: bun install` },
					{ type: 'info', text: `- Customize your setup in highx.config.ts` },
					{ type: 'info', text: `- Git repository initialized` },
					{
						type: 'info',
						text: `- For more info, check documentation at https://highx.dev/docs?ref=cli`,
					},
				])
				setProgress(100)
				setStatus('complete')

				// Auto-exit after success
				setTimeout(() => exit(), 1000)
			} catch (unexpectedError) {
				setMessages([
					{
						type: 'error',
						text: 'An unexpected error occurred during initialization.',
					},
				])
				setStatus('error')
			}
		}

		init()
	}, [name, currentPath, exit])

	return (
		<Box flexDirection="column" padding={1} borderStyle="single">
			{status === 'loading' && (
				<Box flexDirection="column">
					<Text color="magentaBright">Setting up your project...</Text>
					<Text color="yellowBright">Progress: [{progress}%]</Text>
					{messages.map(RenderMessage)}
				</Box>
			)}
			{status === 'complete' && (
				<Box flexDirection="column">
					{messages.map(RenderMessage)}
					<Text color="magentaBright">
						-- Enjoy building AI apps with <HighXLogo /> --
					</Text>
				</Box>
			)}
			{status === 'error' && (
				<Box flexDirection="column">
					{messages.map(RenderMessage)}
					<Text color="redBright">
						Initialization failed. Please resolve the issues and try again.
					</Text>
				</Box>
			)}
		</Box>
	)
}

export default CommandInit

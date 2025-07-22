import { Text } from 'ink'
import React from 'react'
import type { CLIMessage } from '../types'

export const RenderMessage = (msg: CLIMessage, index: number) => (
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

import gradient from 'gradient-string'
import { Text } from 'ink'
import React, { type ReactNode } from 'react'
import packageJson from '../../../package.json'

export const HighXLogo = ({ version }: { version?: boolean }): ReactNode => {
	const gradientText = gradient(['#60a5fa', '#a78bfa'])('HighX')
	return (
		<>
			<Text>{gradientText}</Text>
			{version && <Text color="gray">Version: {packageJson.version}</Text>}
		</>
	)
}

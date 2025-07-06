import { ServerConfigSchema } from '../schema/serverConfig'
import config from '../server.config'

/**
 * Validates and returns the typed configuration object.
 * Throws and exits if validation fails.
 */
export const validateServerConfig = () => {
	const result = ServerConfigSchema.safeParse(config)
	if (!result.success) {
		console.error('Configuration validation failed:', result.error.format())
		process.exit(1)
	}
	return result.data
}

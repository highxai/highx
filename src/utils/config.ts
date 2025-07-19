import type { z } from 'zod/v4'
import { ServerConfigSchema } from '../schema/serverConfig'
import type { ServerConfig } from '../types'

/**
 * Imports and validates the HighX configuration file.
 * The configuration file should export a default function that returns a ServerConfig object.
 * Throws and exits if validation fails.
 * @var {String} filePath - Path to the configuration file
 * @returns {Object} - The validated configuration object
 * @throws {Error} - If the configuration file path is not provided or validation fails
 * @example
 * const config = loadHighXConfig('./config/server.config.ts');
 */
export const loadHighXConfig = async (
	filePath: string,
): Promise<ServerConfig> => {
	if (!filePath) {
		throw new Error('Configuration file path is required')
	}
	const config = await import(filePath)
	if (!config) {
		throw new Error(`Configuration file not found at ${filePath}`)
	}
	if (!config.default) {
		throw new Error('Configuration file must export a default function')
	}

	const result = ServerConfigSchema.safeParse(config.default)
	if (!result.success) {
		console.error('Configuration validation failed:', result.error.format())
		process.exit(1)
	}
	return result.data
}

/**
 * Validates and returns the typed configuration object.
 * Throws and exits if validation fails.
 */
export const validateServerConfig = (
	config: ServerConfig,
): z.infer<typeof ServerConfigSchema> => {
	const result = ServerConfigSchema.safeParse(config)
	if (!result.success) {
		console.error('Configuration validation failed:', result.error.format())
		process.exit(1)
	}
	return result.data
}

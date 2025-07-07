import path from 'node:path'
import type { PluginConfig, PluginMiddleware } from '../types'

/**
 * Loads enabled plugins and returns an array of plugin middleware.
 * @param pluginsConfig List of plugin configs to load.
 */
export async function loadPlugins(
	pluginsConfig: PluginConfig[],
): Promise<PluginMiddleware[]> {
	const plugins: PluginMiddleware[] = []
	if (!pluginsConfig) return plugins

	for (const plugin of pluginsConfig) {
		if (!plugin.enabled) continue
		try {
			const pluginPath = path.resolve(plugin.modulePath)
			const pluginModule = await import(pluginPath)
			const middleware = pluginModule.default as PluginMiddleware["call"]
			plugins.push({
				name: plugin.name,
				call: (req, context) => middleware(req, context),
			})
			console.log(`Loaded plugin: ${plugin.name} from: ${pluginPath}`)
		} catch (err) {
			console.error(`Failed to load plugin ${plugin.name}:`, err)
		}
	}

	return plugins
}

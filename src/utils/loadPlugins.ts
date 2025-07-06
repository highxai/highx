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
			const pluginModule = await import(plugin.modulePath)
			const middleware = pluginModule.default as PluginMiddleware
			plugins.push((req, context) => middleware(req, { config: plugin.config }))
			console.log(`Loaded plugin: ${plugin.name}`)
		} catch (err) {
			console.error(`Failed to load plugin ${plugin.name}:`, err)
		}
	}

	return plugins
}

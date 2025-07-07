import path from 'node:path'
import type { HandlerContext, PluginConfig, PluginMiddleware } from '../types'

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
			const middleware = pluginModule.default as PluginMiddleware['call']
			plugins.push({
				config: plugin,
				call: (req, context) => middleware(req, context),
			})
			console.log(`Loaded plugin: ${plugin.name} from: ${pluginPath}`)
		} catch (err) {
			console.error(`Failed to load plugin ${plugin.name}:`, err)
		}
	}

	return plugins
}

export async function runPlugins(plugins: PluginMiddleware[], req: Request) {
	const context: HandlerContext = {
		name: '',
		modulePath: '',
		config: undefined,
		pluginData: {}, // Initialize pluginData
	}

	for (const [index, plugin] of plugins.entries()) {
		const response = await plugin.call(req, {
			name: plugin.config.name,
			modulePath: plugin.config.modulePath,
			config: plugin.config,
			pluginData: index === 0 ? { firstMember: true } : context.pluginData,
		})
		if (response instanceof Response) return response
		if (response !== undefined) {
			// Store plugin data with a key (e.g., plugin index or name)
			context.pluginData[`plugin_${plugin.config.name}`] = response
		}
	}

	return context
}

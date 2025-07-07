import { z } from 'zod/v4'
import type {
	AiConfig,
	AiContext,
	AiGraphNode,
	PluginMiddleware,
} from '../types'

interface ContextStore {
	getContext(id: string): Promise<AiContext | null>
	saveContext(context: AiContext): Promise<void>
}

class MemoryContextStore implements ContextStore {
	private contexts: Map<string, AiContext> = new Map()
	private maxContexts: number

	constructor(maxContexts: number) {
		this.maxContexts = maxContexts
	}

	async getContext(id: string): Promise<AiContext | null> {
		return this.contexts.get(id) ?? null
	}

	async saveContext(context: AiContext): Promise<void> {
		if (this.contexts.size >= this.maxContexts) {
			const oldest = Array.from(this.contexts.keys())[0]
			this.contexts.delete(oldest)
		}
		this.contexts.set(context.id, context)
	}
}

async function callModel(
	provider: string,
	apiKey: string,
	model: string,
	prompt: string,
): Promise<string> {
	// Placeholder for model inference
	// In a real implementation, this would call the provider's API (e.g., xAI, OpenAI)
	return `Mock response from ${provider} model ${model}: ${prompt}`
}

async function retrieveDocs(
	query: string,
	indexPath: string,
	maxDocs: number,
): Promise<string[]> {
	// Placeholder for RAG document retrieval
	// In a real implementation, this would query a vector store or search index
	return [`Doc 1: ${query}`, `Doc 2: ${query}`].slice(0, maxDocs)
}

async function executeGraph(workflowPath: string, input: unknown): Promise<unknown> {
	// Placeholder for graph workflow execution
	// In a real implementation, this would load and execute a graph of nodes
	return { result: `Mock graph execution with input: ${JSON.stringify(input)}` }
}

const aiPlugin: PluginMiddleware["call"] = async (req, context) => {
    console.log('from plugin', context)
	const config = context.config as AiConfig
	if (!config || !req.url.includes('/api/ai')) return undefined // Go for the next plugin

	const url = new URL(req.url)
	const path = url.pathname

	if (path === '/api/ai/inference' && req.method === 'POST') {
		const body = await req.json()
		const { prompt, model = config.model } = z
			.object({
				prompt: z.string().nonempty(),
				model: z.string().nonempty().optional(),
			})
			.parse(body)

		const response = await callModel(
			config.provider,
			config.apiKey,
			model,
			prompt,
		)
		return new Response(JSON.stringify({ response }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (path === '/api/ai/rag' && req.method === 'POST') {
		const body = await req.json()
		const { query, maxDocs = config.rag.maxDocs } = z
			.object({
				query: z.string().nonempty(),
				maxDocs: z.number().int().min(1).optional(),
			})
			.parse(body)

		const docs = await retrieveDocs(query, config.rag.indexPath, maxDocs)
		const prompt = `Query: ${query}\nDocuments: ${docs.join('\n')}`
		const response = await callModel(
			config.provider,
			config.apiKey,
			config.model,
			prompt,
		)
		return new Response(JSON.stringify({ response, docs }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (path === '/api/ai/graph' && req.method === 'POST') {
		const body = await req.json()
		const { input } = z
			.object({
				input: z.any(),
			})
			.parse(body)

		const result = await executeGraph(config.graph.workflowPath, input)
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (path === '/api/ai/context' && req.method === 'POST') {
		const body = await req.json()
		const { id, data, userId } = z
			.object({
				id: z.string().nonempty(),
				data: z.any(),
				userId: z.string().optional(),
			})
			.parse(body)

		const store: ContextStore =
			config.contextStore.type === 'memory'
				? new MemoryContextStore(config.contextStore.maxContexts)
				: /* Add other store types */ new MemoryContextStore(
						config.contextStore.maxContexts,
					)

		await store.saveContext({ id, userId, data, timestamp: Date.now() })
		return new Response(JSON.stringify({ status: 'saved' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	if (path === '/api/ai/context' && req.method === 'GET') {
		const id = url.searchParams.get('id')
		if (!id) {
			return new Response(JSON.stringify({ error: 'Missing context ID' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const store: ContextStore =
			config.contextStore.type === 'memory'
				? new MemoryContextStore(config.contextStore.maxContexts)
				: /* Add other store types */ new MemoryContextStore(
						config.contextStore.maxContexts,
					)

		const context = await store.getContext(id)
		if (!context) {
			return new Response(JSON.stringify({ error: 'Context not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}
		return new Response(JSON.stringify(context), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	return undefined
}

export default aiPlugin

import { defineConfig } from 'bunup'

export default defineConfig({
	entry: ['src/index.ts', 'src/cli/index.tsx'],
	format: ['esm', 'cjs'],
	dts: true,
	minify: true,
	minifySyntax: true,
	clean: true,
	splitting: true,
	external: ['react', 'ink'],
	target: 'bun',
})

import { defineConfig } from 'bunup'

export default defineConfig({
	entry: ['src/index.ts', 'src/cli.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	minify: true,
	minifySyntax: true,
	clean: true,
	drop: ["console"],
	splitting: true,
})

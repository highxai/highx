import { Glob } from 'bun'

await Bun.spawn(['bun', 'run', 'test'])
const build = await Bun.spawn(['bun', 'run', 'bunup'])

const code = await build.exited

if (code !== 0) {
	console.error('Failed to build')
}

// Copy assets
const glob = new Glob('./src/templates/*')
for (const file of glob.scanSync('.')) {
	const fileData = Bun.file(file)
	Bun.write(file.replaceAll('src', 'dist'), fileData)
}

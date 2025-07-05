import { startServer } from './server'

startServer().catch((err) => {
	console.log('Failed to start server')
})

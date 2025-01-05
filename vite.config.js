import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/server': {
				// Proxy requests starting with "/api"
				target: 'http://127.0.0.1:8000', // The actual API server
				changeOrigin: true, // Adjusts the `Origin` header to match the target URL
				rewrite: (path) => {
					console.log(path);
					return path.replace(/^\/server/, '');
				},
			},
		},
	},
});

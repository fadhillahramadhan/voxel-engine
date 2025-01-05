export default defineConfig({
	server: {
		proxy: {
			'/server': {
				target: 'http://localhost:8000', // Laravel API server
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/server/, ''), // Rewrite /server to /
			},
		},
	},
});

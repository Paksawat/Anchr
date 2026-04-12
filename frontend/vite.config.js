import { defineConfig, loadEnv, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      // Treat .js files that contain JSX as jsx so Vite/Rollup can parse them
      {
        name: 'treat-js-files-as-jsx',
        enforce: 'pre',
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) return null
          return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' })
        },
      },
      react(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      'process.env.REACT_APP_BACKEND_URL': JSON.stringify(env.REACT_APP_BACKEND_URL || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  }
})

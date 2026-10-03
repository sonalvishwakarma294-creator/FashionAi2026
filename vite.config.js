import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-images',
      configureServer(server) {
        const imagesDir = path.resolve(process.cwd(), 'images')
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
        }
        server.middlewares.use('/images', (req, res, next) => {
          // Decode URI and normalize path
          const decodedUrl = decodeURIComponent(req.url)
          const filePath = path.join(imagesDir, decodedUrl)
          
          // Security check: ensure resolved path is within imagesDir
          const resolvedPath = path.resolve(filePath)
          if (!resolvedPath.startsWith(imagesDir)) {
            return next()
          }

          if (fs.existsSync(resolvedPath)) {
            const content = fs.readFileSync(resolvedPath)
            const ext = path.extname(resolvedPath).toLowerCase()
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
            res.setHeader('Cache-Control', 'public, max-age=31536000')
            res.end(content)
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

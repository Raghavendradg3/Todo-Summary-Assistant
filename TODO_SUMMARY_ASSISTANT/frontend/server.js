import { createServer } from 'vite'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// Custom middleware to set correct content-type headers
app.use((req, res, next) => {
  const ext = req.path.split('.').pop()
  
  // Set specific content types based on file extension
  const contentTypes = {
    'svg': 'image/svg+xml',
    'css': 'text/css',
    'jsx': 'text/jsx',
    'js': 'text/javascript',
    'html': 'text/html'
  }
  
  if (contentTypes[ext]) {
    res.setHeader('Content-Type', `${contentTypes[ext]}; charset=utf-8`)
  }
  
  next()
})

const port = process.env.PORT || 5173

// Create Vite server
createServer({
  root: __dirname,
  server: {
    middlewareMode: true
  },
  appType: 'custom'
}).then((vite) => {
  // Use Vite's connect instance as middleware
  app.use(vite.middlewares)

  // Handle all routes by serving index.html
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Read index.html
      let template = fs.readFileSync(
        resolve(__dirname, 'index.html'),
        'utf-8'
      )

      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })

  // Start server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}) 
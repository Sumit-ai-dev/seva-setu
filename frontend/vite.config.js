import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── Tiny in-memory patient sync for cross-device live updates ──
// ASHA worker POSTs patient data → stored in memory → Doctor's phone GETs it
function patientSyncPlugin() {
  const store = new Map()
  return {
    name: 'patient-sync',
    configureServer(server) {
      // POST /patient-sync/:id — ASHA worker pushes patient data
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url?.startsWith('/patient-sync/')) {
          const id = req.url.split('/patient-sync/')[1]
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              store.set(id, JSON.parse(body))
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.writeHead(400)
              res.end('Invalid JSON')
            }
          })
          return
        }
        // GET /patient-sync/:id — Doctor's phone polls for updates
        if (req.method === 'GET' && req.url?.startsWith('/patient-sync/')) {
          const id = req.url.split('/patient-sync/')[1]
          const data = store.get(id)
          res.writeHead(data ? 200 : 404, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(data ? JSON.stringify(data) : '{"error":"not found"}')
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    patientSyncPlugin(),
  ],

  server: {
    host: true,
    port: 5174,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
})

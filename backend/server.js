import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import * as demoData from './controllers/demoData.js'
import * as demoAuth from './controllers/demoAuthController.js'
import * as demoIncidents from './controllers/demoIncidentsController.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

// Choose mode: DB-backed routes if DATABASE_URL present, otherwise demo MVC controllers
if (process.env.DATABASE_URL) {
  // Try a lightweight DB connectivity test; if it fails, fall back to demo mode
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query('SELECT 1')
    await pool.end()

    const { default: authRouter } = await import('./routes/auth.js')
    const { default: incidentsRouter } = await import('./routes/incidents.js')
    app.use('/api/auth', authRouter)
    app.use('/api/incidents', incidentsRouter)
  } catch (err) {
    console.warn('Database unavailable; starting in demo mode:', err && err.message)
    await demoData.initDemoData()
    demoData.setIo(io)

    app.post('/api/auth/register', demoAuth.register)
    app.post('/api/auth/login', demoAuth.login)

    app.get('/api/incidents', demoIncidents.getIncidents)
    app.get('/api/incidents/all', auth, demoIncidents.getAllIncidents)
    app.patch('/api/incidents/:id/status', auth, demoIncidents.updateStatus)
    app.delete('/api/incidents/bulk', auth, demoIncidents.bulkDelete)
    app.delete('/api/incidents/:id', auth, demoIncidents.deleteIncident)
    app.post('/api/incidents/admin/create', auth, demoIncidents.createIncidentAdmin)
    app.post('/api/incidents', auth, demoIncidents.createIncident)
    app.get('/api/admin/stats', auth, adminOnly, demoIncidents.getStats)
  }
} else {
  // No DATABASE_URL: start in-memory demo mode
  await demoData.initDemoData()
  demoData.setIo(io)

  app.post('/api/auth/register', demoAuth.register)
  app.post('/api/auth/login', demoAuth.login)

  app.get('/api/incidents', demoIncidents.getIncidents)
  app.get('/api/incidents/all', auth, demoIncidents.getAllIncidents)
  app.patch('/api/incidents/:id/status', auth, demoIncidents.updateStatus)
  app.delete('/api/incidents/bulk', auth, demoIncidents.bulkDelete)
  app.delete('/api/incidents/:id', auth, demoIncidents.deleteIncident)
  app.post('/api/incidents/admin/create', auth, demoIncidents.createIncidentAdmin)
  app.post('/api/incidents', auth, demoIncidents.createIncident)
  app.get('/api/admin/stats', auth, adminOnly, demoIncidents.getStats)
}

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'no_token' })
  const parts = header.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid_token' })
  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'invalid_token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
    req.user = { id: payload.userId, role: payload.role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

// Middleware para verificar permissão admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  next()
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', mode: 'demo' }))



// Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id)
  demoData.connectedUsers.add(socket.id)
  socket.emit('welcome', { msg: 'connected to SIGEM-AO' })
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id)
    demoData.connectedUsers.delete(socket.id)
  })
})

// Periodically broadcast stats to all connected clients
setInterval(() => {
  const stats = {
    total: demoData.incidents.length,
    active: demoData.incidents.filter(i => i.status === 'active').length,
    connected_users: demoData.connectedUsers.size
  }
  io.emit('stats_update', stats)
}, 5000) // every 5 seconds

const PORT = process.env.PORT || 4001
server.listen(PORT, () => console.log(`🚀 SIGEM-AO backend (DEMO MODE) listening on ${PORT}`))

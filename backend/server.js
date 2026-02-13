import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { createAdminUser } from './db/create_admin.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

// In-memory store
const users = {}
const incidents = []
const connectedUsers = new Set()

// Initialize admin user
const adminUser = await createAdminUser()
users[adminUser.email] = adminUser

// Endereços realistas em Luanda
const LUANDA_ADDRESSES = [
  { address: 'Avenida 4 de Fevereiro, Luanda', lat: -8.8398, lng: 13.2344 },
  { address: 'Rua 17 de Setembro, Maianga', lat: -8.8276, lng: 13.2567 },
  { address: 'Avenida Revolução, Rangel', lat: -8.8567, lng: 13.2123 },
  { address: 'Rua da República, Cazenga', lat: -8.8890, lng: 13.1234 },
  { address: 'Avenida Amílcar Cabral, Samba', lat: -8.7654, lng: 13.3456 },
  { address: 'Rua Kizomba, Ingombota', lat: -8.8123, lng: 13.1567 },
  { address: 'Bairro Popular, Sambizanga', lat: -8.9234, lng: 13.2890 },
  { address: 'Vila Alice, Kilamba', lat: -8.9500, lng: 13.0987 },
  { address: 'Avenida Luanda, Benilson', lat: -8.8756, lng: 13.3210 },
  { address: 'Rua do Mercado, Cazenga', lat: -8.9012, lng: 13.1456 }
]

// Gerar dados de exemplo (demo)
function generateSampleIncidents() {
  const incidents_sample = []
  const severities = ['light', 'medium', 'severe']
  const titles = [
    'Incêndio em residência',
    'Acidente rodoviário',
    'Inundação',
    'Colisão de veículos',
    'Queda estrutural',
    'Incêndio em comércio',
    'Acidente com feridos',
    'Desabamento',
    'Explosão'
  ]
  
  // Gerar 50 incidentes aleatórios nos últimos 30 dias
  const now = new Date()
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const hour = Math.floor(Math.random() * 24)
    const min = Math.floor(Math.random() * 60)
    date.setHours(hour, min, 0, 0)
    
    const addressObj = LUANDA_ADDRESSES[Math.floor(Math.random() * LUANDA_ADDRESSES.length)]
    const incident = {
      id: i + 1,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: `Relatório automático de teste ${i + 1}`,
      address: addressObj.address,
      type_disaster_id: null,
      user_id: 2,
      latitude: addressObj.lat + (Math.random() - 0.5) * 0.01,
      longitude: addressObj.lng + (Math.random() - 0.5) * 0.01,
      severity: severities[Math.floor(Math.random() * 3)],
      status: 'pendente',
      created_at: date.toISOString()
    }
    incidents_sample.push(incident)
  }
  return incidents_sample
}

const sampleIncidents = generateSampleIncidents()
sampleIncidents.forEach(inc => incidents.push(inc))

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

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body
    if (!email || !password || !name) return res.status(400).json({ error: 'missing_fields' })
    if (users[email]) return res.status(409).json({ error: 'user_exists' })

    const hash = await bcrypt.hash(password, 10)
    const id = Object.keys(users).length + 1
    const userRole = role || 'citizen'
    const user = { id, name, email, phone: phone || null, role: userRole }
    users[email] = { ...user, password_hash: hash }

    const token = jwt.sign({ userId: id, role: userRole }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    return res.json({ user, token })
  } catch (err) {
    console.error('Register error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

    const user = users[email]
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const userResponse = { id: user.id, name: user.name, email: user.email, role: user.role }
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    return res.json({ user: userResponse, token })
  } catch (err) {
    console.error('Login error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// GET /api/incidents
app.get('/api/incidents', (req, res) => {
  return res.json({ data: incidents })
})

// GET /api/incidents/all (get all incidents with details for admin)
app.get('/api/incidents/all', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  return res.json({ data: incidents })
})

// PATCH /api/incidents/:id/status - update incident status (admin only)
app.patch('/api/incidents/:id/status', auth, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    
    const { id } = req.params
    const { status } = req.body
    
    if (!status) return res.status(400).json({ error: 'status_required' })
    if (!['pendente', 'em andamento', 'resolvido'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' })
    }
    
    const incident = incidents.find(i => i.id === parseInt(id))
    if (!incident) return res.status(404).json({ error: 'not_found' })
    
    incident.status = status
    incident.updated_at = new Date().toISOString()
    
    // Emit real-time update
    io.emit('incident_status_changed', {
      id: incident.id,
      title: incident.title,
      status: incident.status,
      updated_at: incident.updated_at
    })
    
    return res.json(incident)
  } catch (err) {
    console.error('Status update error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// DELETE /api/incidents/bulk - delete multiple incidents (admin only)
app.delete('/api/incidents/bulk', auth, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    
    const { ids, reason } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'invalid_ids' })
    }
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'reason_required' })
    }
    
    const deletedIncidents = []
    const failedIds = []
    
    // Delete each incident
    for (const id of ids) {
      const incidentIndex = incidents.findIndex(i => i.id === parseInt(id))
      
      if (incidentIndex === -1) {
        failedIds.push(id)
        continue
      }
      
      const deletedIncident = incidents.splice(incidentIndex, 1)[0]
      deletedIncidents.push(deletedIncident)
      
      // Log each deletion
      console.log(`🗑️ Incidente eliminado (bulk) - ID: ${id}, Título: ${deletedIncident.title}, Motivo: ${reason}`)
      
      // Emit real-time update for each deletion
      io.emit('incident_deleted', {
        id: deletedIncident.id,
        title: deletedIncident.title,
        deleted_by: req.user.email,
        deletion_reason: reason,
        deleted_at: new Date().toISOString()
      })
    }
    
    return res.json({ 
      message: `${deletedIncidents.length} incidente(s) eliminado(s) com sucesso`,
      deleted: deletedIncidents,
      failed: failedIds
    })
  } catch (err) {
    console.error('Bulk delete incident error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// DELETE /api/incidents/:id - delete incident (admin only)
app.delete('/api/incidents/:id', auth, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    
    const { id } = req.params
    const { reason } = req.body
    
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason_required' })
    
    const incidentIndex = incidents.findIndex(i => i.id === parseInt(id))
    
    if (incidentIndex === -1) return res.status(404).json({ error: 'not_found' })
    
    const deletedIncident = incidents.splice(incidentIndex, 1)[0]
    
    // Log deletion with reason
    console.log(`🗑️ Incidente eliminado - ID: ${id}, Título: ${deletedIncident.title}, Motivo: ${reason}`)
    
    // Emit real-time update
    io.emit('incident_deleted', {
      id: deletedIncident.id,
      title: deletedIncident.title,
      deleted_by: req.user.email,
      deletion_reason: reason,
      deleted_at: new Date().toISOString()
    })
    
    return res.json({ message: 'Incidente eliminado com sucesso', incident: deletedIncident })
  } catch (err) {
    console.error('Delete incident error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// POST /api/incidents/admin/create - create incident as admin (admin only)
app.post('/api/incidents/admin/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    
    const { title, description, severity, latitude, longitude, address } = req.body
    if (!title || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    const incident = {
      id: incidents.length + 1,
      title,
      description: description || '',
      address: address || 'Localização não especificada',
      type_disaster_id: null,
      user_id: req.user.userId,
      latitude,
      longitude,
      severity: severity || 'medium',
      status: 'pendente',
      created_at: new Date().toISOString()
    }
    incidents.push(incident)

    // Emit real-time alert
    io.emit('new_incident', {
      id: incident.id,
      title: incident.title,
      address: incident.address,
      severity: incident.severity,
      latitude: incident.latitude,
      longitude: incident.longitude,
      created_at: incident.created_at
    })

    return res.status(201).json(incident)
  } catch (err) {
    console.error('Admin incident creation error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// POST /api/incidents - create (authenticated)
app.post('/api/incidents', auth, async (req, res) => {
  try {
    const { title, description, type_disaster_id, severity, latitude, longitude, address } = req.body
    if (!title || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    const incident = {
      id: incidents.length + 1,
      title,
      description: description || null,
      address: address || 'Localização não especificada',
      type_disaster_id: type_disaster_id || null,
      user_id: req.user.id,
      latitude,
      longitude,
      severity: severity || 'medium',
      status: 'pendente',
      created_at: new Date().toISOString()
    }
    incidents.push(incident)

    // Emit real-time alert via Socket.io
    io.emit('new_incident', {
      id: incident.id,
      title: incident.title,
      address: incident.address,
      severity: incident.severity,
      latitude: incident.latitude,
      longitude: incident.longitude,
      created_at: incident.created_at
    })

    return res.status(201).json(incident)
  } catch (err) {
    console.error('Incident creation error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// GET /api/admin/stats - estatísticas para admin
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(new Date().setDate(now.getDate() - 30))

    // Total stats
    const total = incidents.length
    const today_count = incidents.filter(i => new Date(i.created_at) >= today).length
    const week_count = incidents.filter(i => new Date(i.created_at) >= weekAgo).length
    const month_count = incidents.filter(i => new Date(i.created_at) >= monthAgo).length

    // Severity breakdown
    const severity_breakdown = {
      light: incidents.filter(i => i.severity === 'light').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      severe: incidents.filter(i => i.severity === 'severe').length
    }

    // Daily data for last 7 days
    const daily_data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = incidents.filter(inc => inc.created_at.startsWith(dateStr)).length
      daily_data.push({ date: dateStr, count })
    }

    // Weekly data for last 4 weeks
    const weekly_data = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const count = incidents.filter(inc => {
        const incDate = new Date(inc.created_at)
        return incDate >= weekStart && incDate < weekEnd
      }).length
      const weekLabel = `Sem ${Math.floor(i) + 1}`
      weekly_data.push({ week: weekLabel, count })
    }

    // Monthly data for last 12 months
    const monthly_data = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      const count = incidents.filter(inc => {
        const incDate = new Date(inc.created_at)
        return incDate >= monthDate && incDate < nextMonth
      }).length
      const monthLabel = monthDate.toLocaleString('pt-PT', { month: 'short', year: '2-digit' })
      monthly_data.push({ month: monthLabel, count })
    }

    // Top locations (by count)
    const locationMap = {}
    incidents.forEach(inc => {
      const location = inc.address || `${inc.latitude.toFixed(2)}, ${inc.longitude.toFixed(2)}`
      locationMap[location] = (locationMap[location] || 0) + 1
    })
    const top_locations = Object.entries(locationMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }))

    return res.json({
      total,
      today: today_count,
      week: week_count,
      month: month_count,
      severity: severity_breakdown,
      daily: daily_data,
      weekly: weekly_data,
      monthly: monthly_data,
      top_locations
    })
  } catch (err) {
    console.error('Stats error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id)
  connectedUsers.add(socket.id)
  socket.emit('welcome', { msg: 'connected to SIGEM-AO' })
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id)
    connectedUsers.delete(socket.id)
  })
})

// Periodically broadcast stats to all connected clients
setInterval(() => {
  const stats = {
    total: incidents.length,
    active: incidents.filter(i => i.status === 'active').length,
    connected_users: connectedUsers.size
  }
  io.emit('stats_update', stats)
}, 5000) // every 5 seconds

const PORT = process.env.PORT || 4001
server.listen(PORT, () => console.log(`🚀 SIGEM-AO backend (DEMO MODE) listening on ${PORT}`))

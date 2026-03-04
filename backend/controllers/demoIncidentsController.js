import * as demoData from './demoData.js'

function getIo() {
  return demoData.io
}

export function getIncidents(req, res) {
  return res.json({ data: demoData.incidents })
}

export function getAllIncidents(req, res) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  // attach reporter user info when available
  const incidentsWithReporter = demoData.incidents.map(i => {
    const reporter = Object.values(demoData.users).find(u => u.id === i.user_id)
    return {
      ...i,
      reporter: reporter
        ? { id: reporter.id, name: reporter.name, email: reporter.email }
        : null
    }
  })
  return res.json({ data: incidentsWithReporter })
}

export function createIncident(req, res) {
  try {
    const { title, description, type_disaster_id, severity, latitude, longitude, address } = req.body
    if (!title || latitude === undefined || longitude === undefined) return res.status(400).json({ error: 'missing_fields' })

    const incident = {
      id: demoData.incidents.length + 1,
      title,
      description: description || null,
      address: address || 'Localização não especificada',
      type_disaster_id: type_disaster_id || null,
      user_id: req.user && req.user.id,
      latitude,
      longitude,
      severity: severity || 'medium',
      status: 'pendente',
      created_at: new Date().toISOString()
    }
    demoData.incidents.push(incident)
    const io = getIo()
    if (io) io.emit('new_incident', incident)
    return res.status(201).json(incident)
  } catch (err) {
    console.error('Incident creation error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

export function createIncidentAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
  return createIncident(req, res)
}

export function updateStatus(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    const { id } = req.params
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status_required' })
    if (!['pendente', 'em andamento', 'resolvido'].includes(status)) return res.status(400).json({ error: 'invalid_status' })
    const incident = demoData.incidents.find(i => i.id === parseInt(id))
    if (!incident) return res.status(404).json({ error: 'not_found' })
    incident.status = status
    incident.updated_at = new Date().toISOString()
    const io = getIo()
    if (io) io.emit('incident_status_changed', { id: incident.id, title: incident.title, status: incident.status, updated_at: incident.updated_at })
    return res.json(incident)
  } catch (err) {
    console.error('Status update error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

export function deleteIncident(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    const { id } = req.params
    const { reason } = req.body
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason_required' })
    const idx = demoData.incidents.findIndex(i => i.id === parseInt(id))
    if (idx === -1) return res.status(404).json({ error: 'not_found' })
    const deleted = demoData.incidents.splice(idx, 1)[0]
    const io = getIo()
    if (io) io.emit('incident_deleted', { id: deleted.id, title: deleted.title, deleted_by: req.user.email, deletion_reason: reason, deleted_at: new Date().toISOString() })
    return res.json({ message: 'Incidente eliminado com sucesso', incident: deleted })
  } catch (err) {
    console.error('Delete incident error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

export function bulkDelete(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' })
    const { ids, reason } = req.body
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'invalid_ids' })
    if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason_required' })
    const deletedIncidents = []
    const failedIds = []
    for (const id of ids) {
      const incidentIndex = demoData.incidents.findIndex(i => i.id === parseInt(id))
      if (incidentIndex === -1) { failedIds.push(id); continue }
      const deletedIncident = demoData.incidents.splice(incidentIndex, 1)[0]
      deletedIncidents.push(deletedIncident)
      console.log(`🗑️ Incidente eliminado (bulk) - ID: ${id}, Título: ${deletedIncident.title}, Motivo: ${reason}`)
      const io = getIo()
      if (io) io.emit('incident_deleted', { id: deletedIncident.id, title: deletedIncident.title, deleted_by: req.user.email, deletion_reason: reason, deleted_at: new Date().toISOString() })
    }
    return res.json({ message: `${deletedIncidents.length} incidente(s) eliminado(s) com sucesso`, deleted: deletedIncidents, failed: failedIds })
  } catch (err) {
    console.error('Bulk delete incident error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

export function getStats(req, res) {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(new Date().setDate(now.getDate() - 30))
    const total = demoData.incidents.length
    const today_count = demoData.incidents.filter(i => new Date(i.created_at) >= today).length
    const week_count = demoData.incidents.filter(i => new Date(i.created_at) >= weekAgo).length
    const month_count = demoData.incidents.filter(i => new Date(i.created_at) >= monthAgo).length
    const severity_breakdown = { light: demoData.incidents.filter(i => i.severity === 'light').length, medium: demoData.incidents.filter(i => i.severity === 'medium').length, severe: demoData.incidents.filter(i => i.severity === 'severe').length }
    const daily_data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = demoData.incidents.filter(inc => inc.created_at.startsWith(dateStr)).length
      daily_data.push({ date: dateStr, count })
    }
    const weekly_data = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const count = demoData.incidents.filter(inc => { const incDate = new Date(inc.created_at); return incDate >= weekStart && incDate < weekEnd }).length
      const weekLabel = `Sem ${Math.floor(i) + 1}`
      weekly_data.push({ week: weekLabel, count })
    }
    const monthly_data = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      const count = demoData.incidents.filter(inc => { const incDate = new Date(inc.created_at); return incDate >= monthDate && incDate < nextMonth }).length
      const monthLabel = monthDate.toLocaleString('pt-PT', { month: 'short', year: '2-digit' })
      monthly_data.push({ month: monthLabel, count })
    }
    const locationMap = {}
    demoData.incidents.forEach(inc => { const location = inc.address || `${inc.latitude.toFixed(2)}, ${inc.longitude.toFixed(2)}`; locationMap[location] = (locationMap[location] || 0) + 1 })
    const top_locations = Object.entries(locationMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([location, count]) => ({ location, count }))
    return res.json({ total, today: today_count, week: week_count, month: month_count, severity: severity_breakdown, daily: daily_data, weekly: weekly_data, monthly: monthly_data, top_locations })
  } catch (err) {
    console.error('Stats error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

import { useContext, useState, useEffect, useRef } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { io } from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/AdminDashboard.css'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

const SEVERITY_COLORS = {
  light: '#10b981',
  medium: '#f59e0b',
  severe: '#ef4444'
}

const SEVERITY_LABELS = {
  light: 'Leve',
  medium: 'Médio',
  severe: 'Grave'
}

const STATUS_COLORS = {
  pendente: '#f59e0b',
  'em andamento': '#2563eb',
  resolvido: '#10b981'
}

const STATUS_LABELS = {
  pendente: '⏳ Pendente',
  'em andamento': '🔄 Em Andamento',
  resolvido: '✓ Resolvido'
}

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext)
  const { token } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])
  const [allIncidents, setAllIncidents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    address: '',
    latitude: -8.8383,
    longitude: 13.2344
  })
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [deleteConfirmData, setDeleteConfirmData] = useState({ id: null, title: '', reason: '' })
  const [selectedIncidents, setSelectedIncidents] = useState(new Set())
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const createMapRef = useRef(null)
  const createMapInstanceRef = useRef(null)
  const socketRef = useRef(null)

  // Setup Socket.io for real-time alerts
  useEffect(() => {
    socketRef.current = io('http://localhost:4001')
    socketRef.current.on('new_incident', (incident) => {
      setAlerts(prev => [incident, ...prev].slice(0, 10))
    })
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Falha ao carregar estatísticas')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [token])

  // Fetch all incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('http://localhost:4001/api/incidents/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Falha ao carregar incidentes')
        const data = await res.json()
        setAllIncidents(data.data || [])
      } catch (err) {
        console.error('Erro ao buscar incidentes:', err)
      }
    }
    fetchIncidents()
  }, [token])

  // Initialize map modal
  useEffect(() => {
    if (showModal && selectedLocation && mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([selectedLocation.latitude, selectedLocation.longitude], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)
      L.marker([selectedLocation.latitude, selectedLocation.longitude])
        .addTo(map)
        .bindPopup(`<strong>${selectedLocation.title}</strong><br>${selectedLocation.address}`)
        .openPopup()
      mapInstanceRef.current = map
    }
  }, [showModal, selectedLocation])

  // Initialize create incident map
  useEffect(() => {
    if (showCreateModal && createMapRef.current && !createMapInstanceRef.current) {
      const map = L.map(createMapRef.current).setView([formData.latitude, formData.longitude], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      // Add initial marker
      let marker = L.marker([formData.latitude, formData.longitude]).addTo(map)
      marker.bindPopup('Clique no mapa para mover o marcador')

      // Click handler to add/move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        map.removeLayer(marker)
        marker = L.marker([lat, lng]).addTo(map).bindPopup('Marcador movido para aqui')
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }))
      })

      createMapInstanceRef.current = map
    }

    return () => {
      if (!showCreateModal && createMapInstanceRef.current) {
        createMapInstanceRef.current.remove()
        createMapInstanceRef.current = null
      }
    }
  }, [showCreateModal])

  if (loading) return <div className="admin-dashboard"><p>⏳ Carregando...</p></div>
  if (error) return <div className="admin-dashboard"><p className="error-message">❌ {error}</p></div>
  if (!stats) return <div className="admin-dashboard"><p>Sem dados disponíveis</p></div>

  const severityData = [
    { name: 'Leve', value: stats.severity.light, color: SEVERITY_COLORS.light },
    { name: 'Médio', value: stats.severity.medium, color: SEVERITY_COLORS.medium },
    { name: 'Grave', value: stats.severity.severe, color: SEVERITY_COLORS.severe }
  ]

  const openMapModal = (incident) => {
    setSelectedLocation(incident)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setTimeout(() => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }, 300)
  }

  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:4001/api/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Erro ao atualizar status')
      const updated = await res.json()
      
      // Update local incidents
      setAllIncidents(prev => prev.map(i => i.id === incidentId ? updated : i))
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao atualizar status: ' + err.message)
    }
  }

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId)
      } else {
        newSet.add(incidentId)
      }
      return newSet
    })
  }

  const handleSelectAllIncidents = () => {
    if (selectedIncidents.size === allIncidents.length && allIncidents.length > 0) {
      setSelectedIncidents(new Set())
    } else {
      setSelectedIncidents(new Set(allIncidents.map(i => i.id)))
    }
  }

  const handleDeleteIncident = async (incidentId, incidentTitle) => {
    setIsBulkDeleteMode(false)
    setDeleteConfirmData({
      id: incidentId,
      title: incidentTitle,
      reason: ''
    })
    setShowDeleteConfirmModal(true)
  }

  const handleDeleteSelected = () => {
    if (selectedIncidents.size === 0) {
      alert('Selecione pelo menos um incidente')
      return
    }
    setIsBulkDeleteMode(true)
    setDeleteConfirmData({
      id: null,
      title: '',
      reason: ''
    })
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmData.reason.trim()) {
      alert('O motivo da eliminação é obrigatório!')
      return
    }
    
    try {
      if (isBulkDeleteMode) {
        // Bulk delete
        const res = await fetch('http://localhost:4001/api/incidents/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ids: Array.from(selectedIncidents), reason: deleteConfirmData.reason })
        })
        if (!res.ok) throw new Error('Erro ao eliminar incidentes')
        
        // Remove from local list
        setAllIncidents(prev => prev.filter(i => !selectedIncidents.has(i.id)))
        setSelectedIncidents(new Set())
      } else {
        // Single delete
        const res = await fetch(`http://localhost:4001/api/incidents/${deleteConfirmData.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: deleteConfirmData.reason })
        })
        if (!res.ok) throw new Error('Erro ao eliminar incidente')
        
        // Remove from local list
        setAllIncidents(prev => prev.filter(i => i.id !== deleteConfirmData.id))
      }
      setShowDeleteConfirmModal(false)
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao eliminar incidente(s): ' + err.message)
    }
  }

  const handleCreateIncident = async (e) => {
    e.preventDefault()
    
    try {
      if (!formData.title) throw new Error('Título é obrigatório')
      
      const res = await fetch('http://localhost:4001/api/incidents/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
      })
      
      if (!res.ok) throw new Error('Erro ao criar incidente')
      const newIncident = await res.json()
      
      // Add to local list
      setAllIncidents(prev => [...prev, newIncident])
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: 'medium',
        address: '',
        latitude: -8.8383,
        longitude: 13.2344
      })
      setShowCreateModal(false)
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao criar incidente: ' + err.message)
    }
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <h1>📊 SIGEM-AO Admin Dashboard</h1>
          <p>Centro de Controle e Monitoramento</p>
        </div>
        <div className="admin-user">
          <p>👤 {user?.name}</p>
          <span className="role-badge">Admin</span>
          <button onClick={logout} className="btn btn-danger">🔓 Sair</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Visão Geral
        </button>
        <button 
          className={`tab-link ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          📋 Incidentes ({allIncidents.length})
        </button>
        <button 
          className={`tab-link ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alertas ({alerts.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">📍</div>
              <div className="kpi-content">
                <p className="kpi-label">Total de Incidentes</p>
                <p className="kpi-value">{stats.total}</p>
              </div>
            </div>
            <div className="kpi-card kpi-today">
              <div className="kpi-icon">📅</div>
              <div className="kpi-content">
                <p className="kpi-label">Hoje</p>
                <p className="kpi-value">{stats.today}</p>
              </div>
            </div>
            <div className="kpi-card kpi-week">
              <div className="kpi-icon">📆</div>
              <div className="kpi-content">
                <p className="kpi-label">Esta Semana</p>
                <p className="kpi-value">{stats.week}</p>
              </div>
            </div>
            <div className="kpi-card kpi-month">
              <div className="kpi-icon">📊</div>
              <div className="kpi-content">
                <p className="kpi-label">Este Mês</p>
                <p className="kpi-value">{stats.month}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Daily Chart */}
            <div className="chart-card">
              <h3>📈 Incidentes por Dia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" name="Incidentes" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Chart */}
            <div className="chart-card">
              <h3>📊 Incidentes por Semana</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.weekly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#667eea" name="Incidentes" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Chart */}
            <div className="chart-card">
              <h3>📅 Incidentes por Mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" name="Incidentes" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Distribution */}
            <div className="chart-card">
              <h3>⚠️ Distribuição por Severidade</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Locations */}
            <div className="chart-card full-width">
              <h3>🗺️ Locais com Mais Incidentes</h3>
              <div className="locations-list">
                {stats.top_locations && stats.top_locations.length > 0 ? (
                  stats.top_locations.map((loc, idx) => (
                    <div key={idx} className="location-item" onClick={() => {
                      const incident = allIncidents.find(i => i.address === loc.location)
                      if (incident) openMapModal(incident)
                    }}>
                      <div className="location-rank">{idx + 1}</div>
                      <div className="location-name">{loc.location}</div>
                      <div className="location-count">{loc.count} incidentes</div>
                    </div>
                  ))
                ) : (
                  <p>Sem dados de localização</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div className="incidents-section">
          <div className="incidents-header">
            <div>
              <h2>📋 Todos os Incidentes</h2>
              {selectedIncidents.size > 0 && (
                <p className="selected-count">({selectedIncidents.size} selecionado(s))</p>
              )}
            </div>
            <div className="incidents-actions">
              {selectedIncidents.size > 0 && (
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteSelected}
                >
                  🗑️ Deletar Selecionados ({selectedIncidents.size})
                </button>
              )}
              <button 
                className="btn btn-success"
                onClick={() => setShowCreateModal(true)}
              >
                ➕ Novo Incidente
              </button>
            </div>
          </div>
          <div className="incidents-table">
            {allIncidents.length === 0 ? (
              <p className="no-data">Nenhum incidente reportado</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIncidents.size === allIncidents.length && allIncidents.length > 0}
                        onChange={handleSelectAllIncidents}
                        className="checkbox-select-all"
                      />
                    </th>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Endereço</th>
                    <th>Severidade</th>
                    <th>Estado</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allIncidents.slice().reverse().map(incident => (
                    <tr key={incident.id} className={selectedIncidents.has(incident.id) ? 'row-selected' : ''}>
                      <td style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIncidents.has(incident.id)}
                          onChange={() => handleSelectIncident(incident.id)}
                          className="checkbox-incident"
                        />
                      </td>
                      <td>#{incident.id}</td>
                      <td>{incident.title}</td>
                      <td>{incident.address}</td>
                      <td>
                        <span 
                          className="severity-badge" 
                          style={{ backgroundColor: SEVERITY_COLORS[incident.severity] }}
                        >
                          {SEVERITY_LABELS[incident.severity]}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={incident.status}
                          onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                          className="status-select"
                          style={{ borderColor: STATUS_COLORS[incident.status] }}
                        >
                          <option value="pendente">⏳ Pendente</option>
                          <option value="em andamento">🔄 Em Andamento</option>
                          <option value="resolvido">✓ Resolvido</option>
                        </select>
                      </td>
                      <td>{new Date(incident.created_at).toLocaleString('pt-AO')}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-small btn-primary"
                            onClick={() => openMapModal(incident)}
                          >
                            🗺️ Mapa
                          </button>
                          <button 
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteIncident(incident.id, incident.title)}
                          >
                            🗑️ Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="alerts-section">
          <h2>🚨 Alertas em Tempo Real</h2>
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <p className="no-data">Nenhum alerta no momento</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-icon" style={{ backgroundColor: SEVERITY_COLORS[alert.severity] }}>
                    ⚠️
                  </div>
                  <div className="alert-content">
                    <h4>{alert.title}</h4>
                    <p className="alert-address">📍 {alert.address}</p>
                    <p className="alert-time">{new Date(alert.created_at).toLocaleTimeString('pt-AO')}</p>
                  </div>
                  <div className="alert-severity">
                    <span 
                      className="severity-badge" 
                      style={{ backgroundColor: SEVERITY_COLORS[alert.severity] }}
                    >
                      {SEVERITY_LABELS[alert.severity]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Novo Incidente</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Map for location selection */}
              <div className="create-map-section">
                <label>Selecione a Localização no Mapa</label>
                <div ref={createMapRef} className="create-map"></div>
                <p className="map-hint">💡 Clique no mapa para definir a localização do incidente</p>
              </div>

              <form onSubmit={handleCreateIncident} className="create-form">
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Incêndio em residência"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição detalhada do incidente"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Severidade</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    >
                      <option value="light">Leve</option>
                      <option value="medium">Médio</option>
                      <option value="severe">Grave</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Endereço</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Avenida 4 de Fevereiro, Luanda"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude (atualizada pelo mapa)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude (atualizada pelo mapa)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn btn-success">✓ Criar Incidente</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showModal && selectedLocation && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗺️ {selectedLocation.title}</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div ref={mapRef} className="modal-map"></div>
              <div className="incident-details">
                <p><strong>Endereço:</strong> {selectedLocation.address}</p>
                <p><strong>Severidade:</strong> <span 
                  className="severity-badge"
                  style={{ backgroundColor: SEVERITY_COLORS[selectedLocation.severity] }}
                >
                  {SEVERITY_LABELS[selectedLocation.severity]}
                </span></p>
                <p><strong>Data:</strong> {new Date(selectedLocation.created_at || selectedLocation.date).toLocaleString('pt-AO')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirmar Eliminação</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirmModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {isBulkDeleteMode ? (
                <>
                  <p className="warn-text">Tem certeza que deseja eliminar {selectedIncidents.size} incidente(s)?</p>
                  <div className="bulk-delete-list">
                    <strong>Incidentes a eliminar:</strong>
                    <ul>
                      {allIncidents.filter(i => selectedIncidents.has(i.id)).map(incident => (
                        <li key={incident.id}>#{incident.id} - {incident.title}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="warn-text">Tem certeza que deseja eliminar o incidente?</p>
                  <p className="incident-name"><strong>"{deleteConfirmData.title}"</strong></p>
                </>
              )}
              
              <div className="form-group">
                <label>Motivo da Eliminação *</label>
                <textarea
                  value={deleteConfirmData.reason}
                  onChange={(e) => setDeleteConfirmData({ ...deleteConfirmData, reason: e.target.value })}
                  placeholder="Descreva o motivo da eliminação..."
                  rows="4"
                  className="delete-reason-input"
                />
              </div>

              <div className="form-buttons delete-buttons">
                <button 
                  className="btn btn-danger-large"
                  onClick={handleConfirmDelete}
                >
                  🗑️ Eliminar
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteConfirmModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  )
}

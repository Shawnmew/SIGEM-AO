import { useContext, useState, useEffect, useRef } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

export default function ReportIncident() {
  const { token } = useContext(AuthContext)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [severity, setSeverity] = useState('medium') // light, medium, severe
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState('address') // 'address' ou 'map'
  const [mapInitialized, setMapInitialized] = useState(false)

  const mapCenter = [-8.8383, 13.2344] // Luanda, Angola

  useEffect(() => {
    if (mode === 'map' && mapRef.current && !mapInitialized) {
      // Initialize map
      const map = L.map(mapRef.current).setView(mapCenter, 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      // Click handler to add marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        
        // Remove old marker if exists
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup('📍 Incidente aqui')
        
        // Update coordinates
        setLatitude(lat.toString())
        setLongitude(lng.toString())
      })

      mapInstanceRef.current = map
      setMapInitialized(true)
    }

    return () => {
      if (mapInstanceRef.current && mode !== 'map') {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        setMapInitialized(false)
      }
    }
  }, [mode, mapInitialized])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      // Validações
      if (!title) throw new Error('Título é obrigatório')
      
      if (mode === 'address' && !address) {
        throw new Error('Endereço é obrigatório neste modo')
      }
      
      if (mode === 'map' && (!latitude || !longitude)) {
        throw new Error('Selecione uma localização no mapa')
      }

      const res = await fetch('http://localhost:4001/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          severity,
          address: address || 'Localização obtida do mapa',
          latitude: latitude ? parseFloat(latitude) : mapCenter[0],
          longitude: longitude ? parseFloat(longitude) : mapCenter[1]
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')

      setMessage('✓ Incidente reportado com sucesso! 🎉')
      setTitle('')
      setDescription('')
      setAddress('')
      setLatitude('')
      setLongitude('')
      setSeverity('medium')
      
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current)
        markerRef.current = null
      }
      
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setMessage('❌ Erro: ' + (err.message || 'Desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-card">
      <h2>📋 Reportar Incidente</h2>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${mode === 'address' ? 'active' : ''}`}
          onClick={() => setMode('address')}
        >
          📝 Por Endereço
        </button>
        <button
          className={`tab-btn ${mode === 'map' ? 'active' : ''}`}
          onClick={() => setMode('map')}
        >
          🗺️ Pelo Mapa
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Título do Incidente *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Incêndio em moradia, Acidente rodoviário..."
            required
          />
          <span className="info-text">Descreva brevemente o tipo de emergência</span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Descrição Detalhada</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Forneça mais detalhes sobre a situação, número de pessoas afetadas, danos visíveis, etc..."
            style={{ minHeight: '120px' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="severity">Nível de Severidade *</label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            required
          >
            <option value="light">🟢 Leve (pequenos danos, sem feridos)</option>
            <option value="medium">🟡 Médio (danos moderados, possíveis feridos)</option>
            <option value="severe">🔴 Grave (danos graves, múltiplos feridos)</option>
          </select>
          <span className="info-text">Indique a severidade estimada do incidente</span>
        </div>

        {mode === 'address' && (
          <div className="form-group">
            <label htmlFor="address">Endereço / Localização *</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ex: Rua Principal, nº 123, Bairro X, Luanda"
              required={mode === 'address'}
            />
            <span className="info-text">Indique com o máximo de detalhe a localização do incidente</span>
          </div>
        )}

        {mode === 'map' && (
          <div className="map-section">
            <div className="map-info">
              📍 Clique no mapa para selecionar a localização exata do incidente
            </div>
            <div className="map-container" ref={mapRef} />
            {latitude && longitude && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dbeafe', borderRadius: '8px' }}>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  ✓ Localização selecionada: {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                </p>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={message.includes('✓') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className={`btn btn-primary ${loading ? 'loading' : ''}`}>
          {loading ? '⏳ Enviando...' : '📤 Reportar Incidente'}
        </button>
      </form>
    </div>
  )
}

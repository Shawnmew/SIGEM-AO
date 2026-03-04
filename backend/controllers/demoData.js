import { createAdminUser } from '../db/create_admin.js'

export const users = {}
export const incidents = []
export const connectedUsers = new Set()

export let io = null
export function setIo(instance) { io = instance }

export async function initDemoData() {
  const adminUser = await createAdminUser()
  users[adminUser.email] = adminUser
  const sample = generateSampleIncidents()
  sample.forEach(i => incidents.push(i))
}

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

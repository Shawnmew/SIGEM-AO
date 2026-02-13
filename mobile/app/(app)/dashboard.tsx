import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_URL = 'http://192.168.1.100:4001'

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

export default function DashboardScreen() {
  const router = useRouter()
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIncidents()
    setupSocket()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/incidents`, {
        headers: { 'Authorization': `Bearer ${global.authToken}` }
      })
      setIncidents(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const socket = io(API_URL)
    socket.on('new_incident', (incident) => {
      setAlerts(prev => [incident, ...prev].slice(0, 10))
      setIncidents(prev => [incident, ...prev])
    })
    return () => socket.disconnect()
  }

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar' },
      {
        text: 'Sair',
        onPress: () => {
          global.authToken = null
          global.authUser = null
          router.replace('/login')
        }
      }
    ])
  }

  const renderIncidentCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: SEVERITY_COLORS[item.severity] }
          ]}
        >
          <Text style={styles.badgeText}>{SEVERITY_LABELS[item.severity]}</Text>
        </View>
      </View>
      <Text style={styles.address}>📍 {item.address}</Text>
      <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString('pt-AO')}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(app)/report-incident')}
        >
          <Text style={styles.actionText}>➕ Reportar Incidente</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>🚨 Novos Alertas</Text>
            {alerts.map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertAddress}>📍 {alert.address}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>📋 Incidentes</Text>
        {loading ? (
          <Text style={styles.loading}>Carregando...</Text>
        ) : incidents.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum incidente</Text>
        ) : (
          <FlatList
            data={incidents}
            renderItem={renderIncidentCard}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  header: {
    backgroundColor: '#667eea',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  logoutText: {
    color: 'white',
    fontWeight: '600'
  },
  actions: {
    padding: 16,
    gap: 10
  },
  actionButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 12
  },
  alertsSection: {
    marginBottom: 20
  },
  alertItem: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  alertTitle: {
    fontWeight: '700',
    color: '#92400e'
  },
  alertAddress: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 4
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6
  },
  status: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 4
  },
  date: {
    fontSize: 11,
    color: '#999'
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40
  }
})

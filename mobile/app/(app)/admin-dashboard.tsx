import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'
import { io } from 'socket.io-client'

const API_URL = 'http://192.168.0.201:4001'

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

export default function AdminDashboardScreen() {
  const router = useRouter()
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedIncidents, setSelectedIncidents] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    fetchIncidents()
    setupSocket()
  }, [])

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/incidents/all`, {
        headers: { 'Authorization': `Bearer ${(global as any).authToken}` }
      })
      setIncidents(res.data || [])
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch error:', err?.message)
      setLoading(false)
    }
  }

  const setupSocket = () => {
    try {
      const socket = io(API_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })
      
      socket.on('new_incident', (incident: any) => {
        setAlerts(prev => [incident, ...prev].slice(0, 10))
        setIncidents(prev => [incident, ...prev])
      })
      
      socket.on('incident_status_changed', (data: any) => {
        setIncidents(prev =>
          prev.map(i => i.id === data.id ? { ...i, status: data.status } : i)
        )
      })
      
      socket.on('incident_deleted', () => {
        fetchIncidents()
      })
      
      return () => {
        if (socket) socket.disconnect()
      }
    } catch (err: any) {
      console.error('Socket setup error:', err?.message)
    }
  }

  const handleSelectIncident = (id) => {
    const newSet = new Set(selectedIncidents)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIncidents(newSet)
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`${API_URL}/api/incidents/${id}/status`, {
        status: newStatus
      }, {
        headers: { 'Authorization': `Bearer ${(global as any).authToken}` }
      })
      fetchIncidents()
    } catch (err: any) {
      Alert.alert('Erro', 'Falha ao atualizar status')
    }
  }

  const handleDeleteSelected = () => {
    if (selectedIncidents.size === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos um incidente')
      return
    }
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Erro', 'Motivo da eliminação é obrigatório')
      return
    }

    try {
      await axios.delete(`${API_URL}/api/incidents/bulk`, {
        data: {
          ids: Array.from(selectedIncidents),
          reason: deleteReason
        },
        headers: { 'Authorization': `Bearer ${(global as any).authToken}` }
      })
      setShowDeleteModal(false)
      setDeleteReason('')
      setSelectedIncidents(new Set())
      fetchIncidents()
      Alert.alert('Sucesso', 'Incidentes deletados')
    } catch (err: any) {
      Alert.alert('Erro', 'Falha ao deletar incidentes')
    }
  }

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar' },
      {
        text: 'Sair',
        onPress: () => {
          ;(global as any).authToken = null
          ;(global as any).authUser = null
          router.replace('/login')
        }
      }
    ])
  }

  const renderIncidentCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => handleSelectIncident(item.id)}
      >
        <View
          style={[
            styles.checkboxBox,
            selectedIncidents.has(item.id) && styles.checkboxBoxActive
          ]}
        >
          {selectedIncidents.has(item.id) && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>#{item.id} {item.title}</Text>
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

        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[styles.statusSelect, { borderColor: STATUS_COLORS[item.status] }]}
            onPress={() => {
              const statuses = ['pendente', 'em andamento', 'resolvido']
              const current = statuses.indexOf(item.status)
              const next = statuses[(current + 1) % statuses.length]
              handleStatusChange(item.id, next)
            }}
          >
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>{new Date(item.created_at).toLocaleString('pt-AO')}</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {selectedIncidents.size > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkText}>
            {selectedIncidents.size} selecionado(s)
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteSelected}
          >
            <Text style={styles.deleteText}>🗑️ Deletar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>🚨 Novos Alertas</Text>
            {alerts.slice(0, 3).map((alert, idx) => (
              <View key={idx} style={styles.alertItem}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertAddress}>📍 {alert.address}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>📋 Todos Incidentes</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 40 }} />
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

      {showDeleteModal && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Confirmar Eliminação</Text>
            <Text style={styles.modalText}>
              {selectedIncidents.size} incidente(s) serão deletados
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Motivo da eliminação..."
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    fontSize: 20,
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
    fontWeight: '600',
    fontSize: 12
  },
  bulkActions: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#c7d2fe'
  },
  bulkText: {
    color: '#667eea',
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12
  },
  content: {
    flex: 1,
    padding: 12
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
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  checkbox: {
    marginRight: 10,
    justifyContent: 'center'
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxBoxActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea'
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold'
  },
  cardContent: {
    flex: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 14,
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
    fontSize: 10
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6
  },
  statusRow: {
    marginBottom: 6
  },
  statusSelect: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },
  date: {
    fontSize: 10,
    color: '#999'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  modalText: {
    color: '#666',
    marginBottom: 16
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmText: {
    color: 'white',
    fontWeight: '600'
  },
  cancelModalButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelModalText: {
    color: '#666',
    fontWeight: '600'
  }
})

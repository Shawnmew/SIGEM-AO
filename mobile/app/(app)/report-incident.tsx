import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'

const API_URL = 'http://192.168.1.100:4001'

export default function ReportIncidentScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title || !address) {
      Alert.alert('Erro', 'Título e endereço são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/incidents`, {
        title,
        description,
        address,
        severity,
        latitude: -8.8383,
        longitude: 13.2344
      }, {
        headers: { 'Authorization': `Bearer ${global.authToken}` }
      })

      Alert.alert('Sucesso', 'Incidente reportado!')
      router.back()
    } catch (err) {
      Alert.alert('Erro', 'Falha ao reportar incidente')
      console.error('Report error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reportar Novo Incidente</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Incêndio em residência"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Endereço *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Avenida 4 de Fevereiro, Luanda"
          value={address}
          onChangeText={setAddress}
          editable={!loading}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Detalhes do incidente..."
          value={description}
          onChangeText={setDescription}
          editable={!loading}
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Severidade</Text>
        <View style={styles.severityGroup}>
          {['light', 'medium', 'severe'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityButton,
                severity === level && styles.severityButtonActive
              ]}
              onPress={() => setSeverity(level)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  severity === level && styles.severityButtonTextActive
                ]}
              >
                {level === 'light' ? 'Leve' : level === 'medium' ? 'Médio' : 'Grave'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reportar Incidente</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333'
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  severityGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  severityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  severityButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea'
  },
  severityButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13
  },
  severityButtonTextActive: {
    color: 'white'
  },
  button: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  }
})

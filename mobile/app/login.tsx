import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'

const API_URL = 'http://192.168.0.201:4001'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@sigem.local')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Email e senha são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      })

      if (res.data.token) {
        // Save token to storage
        const token = res.data.token
        // Store in AsyncStorage or similar
        global.authToken = token
        global.authUser = res.data.user

        // Navigate to app
        if (res.data.user.role === 'admin') {
          router.replace('/(app)/admin-dashboard')
        } else {
          router.replace('/(app)/dashboard')
        }
      }
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao fazer login')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SIGEM-AO</Text>
      <Text style={styles.subtitle}>Sistema de Gestão de Emergências</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          placeholderTextColor="#999"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>Não tiene conta? Registre-se</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center'
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333'
  },
  button: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  link: {
    color: '#667eea',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500'
  }
})

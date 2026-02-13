import { useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function LoginForm({ onSuccess }) {
  const { login, loading } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.message || 'Login falhou')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1.5rem', color: '#2563eb', textAlign: 'center' }}>Entrar na sua Conta</h2>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? '⏳ Autenticando...' : '✓ Entrar'}
      </button>
    </form>
  )
}

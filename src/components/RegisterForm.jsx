import { useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export default function RegisterForm({ onSuccess }) {
  const { register, loading } = useContext(AuthContext)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register(name, email, password, phone)
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.message || 'Registro falhou')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: '1.5rem', color: '#2563eb', textAlign: 'center' }}>Criar Conta</h2>

      <div className="form-group">
        <label htmlFor="name">Nome Completo</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="João da Silva"
          required
        />
      </div>

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

      <div className="form-group">
        <label htmlFor="phone">Telefone (opcional)</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+244 9xx xxx xxx"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? '⏳ Registrando...' : '✓ Registrar'}
      </button>
    </form>
  )
}

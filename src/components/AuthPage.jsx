import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthPage({ onSuccess }) {
  const [tab, setTab] = useState('login')

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>🚨 SIGEM-AO</h1>
        <p>Centro de Gestão de Emergências em Tempo Real</p>
      </div>

      <div className="auth-tabs">
        <button
          className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
          onClick={() => setTab('login')}
        >
          Entrar
        </button>
        <button
          className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
          onClick={() => setTab('register')}
        >
          Registrar
        </button>
      </div>

      <div className="auth-form-container">
        {tab === 'login' && <LoginForm onSuccess={onSuccess} />}
        {tab === 'register' && <RegisterForm onSuccess={onSuccess} />}
      </div>
    </div>
  )
}

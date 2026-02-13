import { useContext } from 'react'
import { AuthContext } from './contexts/AuthContext'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

function App() {
  const { user, token } = useContext(AuthContext)

  if (!user || !token) {
    return <AuthPage />
  }

  return (
    <div className="app">
      {user.role === 'admin' ? <AdminDashboard /> : <Dashboard />}
    </div>
  )
}

export default App

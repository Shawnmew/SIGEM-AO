import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import ReportIncident from './ReportIncident'

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext)

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🚨 SIGEM-AO Dashboard</h1>
        </div>
        <div className="user-info">
          <p>👤 {user?.name}</p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0.25rem 0' }}>{user?.email}</p>
          <button onClick={logout} className="btn btn-danger">
            🔓 Sair
          </button>
        </div>
      </div>
      <ReportIncident />
    </div>
  )
}

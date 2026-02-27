import { useNavigate, useLocation } from 'react-router-dom'
import { Compass, BarChart2, Plus, Shield, User } from 'lucide-react'

const NAV = [
  { path: '/',             label: 'Map',     icon: Compass },
  { path: '/health',       label: 'Stats',   icon: BarChart2 },
  null, // FAB placeholder
  { path: '/vaccinations', label: 'Shields', icon: Shield },
  { path: '/settings',     label: 'Hero',    icon: User },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <div className="page-content">{children}</div>
      <nav className="bottom-nav">
        {NAV.map((item) => {
          if (!item) return (
            <button key="fab" className="nav-fab" onClick={() => navigate('/medications')} aria-label="Medications">
              <Plus size={26} />
            </button>
          )
          const { path, label, icon: Icon } = item
          return (
            <button
              key={path}
              className={`nav-item ${pathname === path ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={22} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

import { NavLink } from 'react-router-dom'

export default function WorkerNav() {
  const tabStyle = ({ isActive }) => ({
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 14,
    fontWeight: 600,
    background: isActive ? 'var(--roam-orange)' : 'var(--roam-orange-tint)',
    color: isActive ? 'var(--roam-white)' : 'var(--roam-orange-dark)',
  })

  return (
    <nav style={{ display: 'flex', gap: 8, maxWidth: 600, margin: '0 auto', padding: '0 16px 8px' }}>
      <NavLink to="/menu" end style={tabStyle}>
        Menu
      </NavLink>
      <NavLink to="/orders" style={tabStyle}>
        Track orders
      </NavLink>
    </nav>
  )
}

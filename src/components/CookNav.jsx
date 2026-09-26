import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CookNav() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '16px 20px 0',
        flexWrap: 'wrap',
      }}
    >
      <NavLink
        to="/cook"
        end
        style={({ isActive }) => ({
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 14,
          fontWeight: 600,
          background: isActive ? 'var(--roam-orange)' : 'var(--roam-orange-tint)',
          color: isActive ? 'var(--roam-white)' : 'var(--roam-orange-dark)',
        })}
      >
        Order queue
      </NavLink>
      <NavLink
        to="/cook/stock"
        style={({ isActive }) => ({
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 14,
          fontWeight: 600,
          background: isActive ? 'var(--roam-orange)' : 'var(--roam-orange-tint)',
          color: isActive ? 'var(--roam-white)' : 'var(--roam-orange-dark)',
        })}
      >
        Menu & stock
      </NavLink>
      <NavLink
        to="/cook/announcements"
        style={({ isActive }) => ({
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 14,
          fontWeight: 600,
          background: isActive ? 'var(--roam-orange)' : 'var(--roam-orange-tint)',
          color: isActive ? 'var(--roam-white)' : 'var(--roam-orange-dark)',
        })}
      >
        Announce
      </NavLink>
      <button className="secondary" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
        Log out
      </button>
    </nav>
  )
}

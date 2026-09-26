import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { supabase } from '../lib/supabaseClient'

export default function Header({ title, subtitle, showLogout = true }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '20px 16px 8px',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <img src={logo} alt="Roam" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 22, lineHeight: 1.1 }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--roam-charcoal)', fontSize: 14 }}>{subtitle}</p>
        )}
      </div>
      {showLogout && (
        <button className="secondary" onClick={handleLogout} style={{ fontSize: 13, padding: '6px 14px' }}>
          Log out
        </button>
      )}
    </header>
  )
}

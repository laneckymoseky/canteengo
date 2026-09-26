import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profile?.role === 'cook') navigate('/cook')
    else if (profile?.role === 'admin') navigate('/admin')
    else navigate('/menu')
  }

  return (
    <AuthLayout>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p style={{ color: 'var(--roam-charcoal)', marginTop: 0, marginBottom: 24 }}>
          Order lunch before you even leave your desk.
        </p>
        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 10 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 16 }}
          />
          {error && <p style={{ color: 'var(--roam-danger)', fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

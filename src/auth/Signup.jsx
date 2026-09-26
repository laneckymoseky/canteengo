import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

// Change this to your company's real email domain, or remove the check entirely.
const ALLOWED_DOMAIN = '@roam-electric.com'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSignup(e) {
    e.preventDefault()
    setError('')

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError(`Please use your work email (${ALLOWED_DOMAIN})`)
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate('/login')
  }

  return (
    <AuthLayout>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 16 }}>Create account</h2>
        <form onSubmit={handleSignup} style={{ textAlign: 'left' }}>
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 10 }}
          />
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
            minLength={6}
            style={{ display: 'block', width: '100%', marginBottom: 16 }}
          />
          {error && <p style={{ color: 'var(--roam-danger)', fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Sign up'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}

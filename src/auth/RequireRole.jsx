import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Wrap a route with <RequireRole role="cook"> ... </RequireRole>
// Pass an array to allow multiple roles: role={['cook','admin']}
export default function RequireRole({ role, children }) {
  const [status, setStatus] = useState('loading') // loading | allowed | denied | unauthenticated

  useEffect(() => {
    let active = true

    async function check() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session) {
        if (active) setStatus('unauthenticated')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const allowedRoles = Array.isArray(role) ? role : [role]
      if (active) setStatus(allowedRoles.includes(profile?.role) ? 'allowed' : 'denied')
    }

    check()
    return () => {
      active = false
    }
  }, [role])

  if (status === 'loading') return <p>Loading...</p>
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'denied') return <Navigate to="/" replace />
  return children
}

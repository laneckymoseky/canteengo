import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import logo from '../assets/logo.png'
import CookNav from '../components/CookNav'
import OnboardingTour from '../components/OnboardingTour'

const NEXT_STATUS = {
  awaiting_cash_verification: 'preparing',
  preparing: 'ready_for_pickup',
  ready_for_pickup: 'collected',
}
const BUTTON_LABEL = {
  awaiting_cash_verification: 'Confirm cash received & start preparing',
  preparing: 'Mark ready for pickup',
  ready_for_pickup: 'Mark collected',
}

export default function OrderQueue() {
  const [orders, setOrders] = useState([])
  const [showTour, setShowTour] = useState(false)
  const [role, setRole] = useState('cook')

  useEffect(() => {
    fetchActiveOrders()
    checkTourStatus()
    const channel = supabase
      .channel('cook_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () =>
        fetchActiveOrders()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function checkTourStatus() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, has_completed_tour')
      .eq('id', sessionData.session.user.id)
      .single()
    if (profile) {
      setRole(profile.role)
      if (!profile.has_completed_tour) setShowTour(true)
    }
  }

  async function fetchActiveOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(qty, unit_price, daily_menu(menu_master(name))), profiles(full_name)')
      .in('status', ['awaiting_cash_verification', 'preparing', 'ready_for_pickup'])
      .order('created_at', { ascending: true })
    setOrders(data || [])
  }

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status]
    if (!next) return

    const updates = { status: next }
    if (order.status === 'awaiting_cash_verification') {
      const { data: sessionData } = await supabase.auth.getSession()
      updates.verified_by = sessionData.session.user.id
      updates.verified_at = new Date().toISOString()
    }

    await supabase.from('orders').update(updates).eq('id', order.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--roam-black)' }}>
      {showTour && <OnboardingTour role={role} onFinish={() => setShowTour(false)} />}
      <CookNav />
      <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <img src={logo} alt="Roam" style={{ width: 36, height: 36 }} />
        <h1 style={{ color: 'var(--roam-white)', fontSize: 26 }}>Order queue</h1>
      </div>

      {orders.length === 0 && (
        <p style={{ color: '#ccc', fontSize: 18 }}>No active orders right now.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {orders.map((order) => (
          <div
            key={order.id}
            className="card"
            style={{
              fontSize: 18,
              borderTop:
                order.status === 'ready_for_pickup'
                  ? '6px solid var(--roam-success)'
                  : order.status === 'awaiting_cash_verification'
                  ? '6px solid var(--roam-danger)'
                  : '6px solid var(--roam-orange)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontFamily: 'var(--font-display)' }}>
                {order.profiles?.full_name || 'Worker'}
              </strong>
              <span>KES {order.total_amount}</span>
            </div>
            {order.payment_method === 'cash' && (
              <span className="badge danger" style={{ marginBottom: 8, display: 'inline-block' }}>
                Cash — verify at counter
              </span>
            )}
            <ul style={{ paddingLeft: 20, margin: '0 0 16px' }}>
              {order.order_items?.map((oi, idx) => (
                <li key={idx}>
                  {oi.daily_menu?.menu_master?.name} × {oi.qty}
                </li>
              ))}
            </ul>
            <button
              style={{ fontSize: 18, padding: '14px 20px', width: '100%' }}
              onClick={() => advanceStatus(order)}
            >
              {BUTTON_LABEL[order.status]}
            </button>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

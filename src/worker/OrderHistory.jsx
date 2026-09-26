import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import WorkerNav from '../components/WorkerNav'

const STATUS_BADGE = {
  pending_payment: { text: 'Awaiting payment', cls: '' },
  awaiting_cash_verification: { text: 'Pay at counter', cls: 'danger' },
  preparing: { text: 'Preparing', cls: '' },
  ready_for_pickup: { text: 'Ready for pickup', cls: 'success' },
  collected: { text: 'Collected', cls: 'success' },
  cancelled: { text: 'Cancelled', cls: 'danger' },
  payment_failed: { text: 'Payment failed', cls: 'danger' },
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('worker_order_history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchOrders() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_amount, payment_method, created_at, order_items(qty, daily_menu(menu_master(name)))')
      .eq('worker_id', sessionData.session.user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const active = orders.filter((o) => !['collected', 'cancelled', 'payment_failed'].includes(o.status))
  const past = orders.filter((o) => ['collected', 'cancelled', 'payment_failed'].includes(o.status))

  function renderOrder(order) {
    const badge = STATUS_BADGE[order.status] || { text: order.status, cls: '' }
    const itemsSummary = order.order_items
      ?.map((oi) => `${oi.daily_menu?.menu_master?.name} x${oi.qty}`)
      .join(', ')

    return (
      <Link key={order.id} to={`/order-status/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge ${badge.cls}`}>{badge.text}</span>
            <span style={{ fontSize: 13, color: 'var(--roam-charcoal)' }}>
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          <p style={{ margin: '8px 0 4px', fontSize: 14 }}>{itemsSummary}</p>
          <strong>KES {order.total_amount}</strong>
        </div>
      </Link>
    )
  }

  if (loading) return <p className="page">Loading your orders...</p>

  return (
    <div>
      <Header title="Order tracking" subtitle="Your active and past orders" />
      <WorkerNav />
      <div className="page">
        {active.length > 0 && (
          <>
            <h3>Active</h3>
            {active.map(renderOrder)}
          </>
        )}

        <h3 style={{ marginTop: active.length > 0 ? 24 : 0 }}>History</h3>
        {past.length === 0 && <p style={{ color: 'var(--roam-charcoal)' }}>No past orders yet.</p>}
        {past.map(renderOrder)}
      </div>
    </div>
  )
}

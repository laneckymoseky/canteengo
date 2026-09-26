import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Chat from './Chat'

const STATUS_LABELS = {
  pending_payment: 'Waiting for payment...',
  awaiting_cash_verification: 'Go pay at the counter — cook will confirm and start preparing',
  preparing: 'Your food is being prepared',
  ready_for_pickup: 'Ready! Come pick it up',
  collected: 'Collected — enjoy your meal',
  cancelled: 'Order cancelled',
  payment_failed: 'Payment failed',
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    fetchOrder()

    // If an M-Pesa order has been sitting unpaid for over 3 minutes with no
    // callback from Safaricom, treat it as failed so the worker isn't stuck
    // waiting forever (STK prompts can silently time out on the phone).
    const timeoutCheck = setInterval(async () => {
      const { data } = await supabase.from('orders').select('status, payment_method, created_at').eq('id', orderId).single()
      if (!data) return
      const ageMs = Date.now() - new Date(data.created_at).getTime()
      if (data.status === 'pending_payment' && data.payment_method === 'mpesa' && ageMs > 3 * 60 * 1000) {
        await supabase.from('orders').update({ status: 'payment_failed' }).eq('id', orderId)
      }
    }, 15000)

    const channel = supabase
      .channel(`order_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timeoutCheck)
    }
  }, [orderId])

  async function fetchOrder() {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single()
    setOrder(data)
  }

  async function retryPayment() {
    setRetrying(true)
    // You'd want to re-collect the phone number here; simplified for the starter version
    const phone = prompt('Re-enter your M-Pesa phone (2547XXXXXXXX):')
    await supabase.functions.invoke('stk-push', {
      body: { order_id: orderId, phone, amount: order.total_amount },
    })
    setRetrying(false)
  }

  async function cancelOrder() {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    fetchOrder()
  }

  if (!order) return <p>Loading order...</p>

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Order status</h2>
      <p style={{ fontSize: 18 }}>{STATUS_LABELS[order.status] || order.status}</p>
      <p>Total: KES {order.total_amount}</p>

      {(order.status === 'pending_payment' || order.status === 'awaiting_cash_verification') && (
        <button onClick={cancelOrder}>Cancel order</button>
      )}
      {order.status === 'payment_failed' && (
        <button onClick={retryPayment} disabled={retrying}>
          {retrying ? 'Retrying...' : 'Retry payment'}
        </button>
      )}

      <hr style={{ margin: '24px 0' }} />
      <Chat orderId={orderId} />
    </div>
  )
}

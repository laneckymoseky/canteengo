import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LottiePlayer from '../components/LottiePlayer'
import orderFoodAnim from '../assets/animations/order_food.json'

export default function Cart() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mpesa') // 'mpesa' | 'cash'
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Prefill phone from the worker's saved profile, if they've set one before
    async function loadPhone() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', sessionData.session.user.id)
        .single()
      if (profile?.phone_number) setPhone(profile.phone_number)
    }
    loadPhone()
  }, [])

  if (!state?.cart) return <p className="page">Your cart is empty. Go back to the menu.</p>

  if (placing) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
        <LottiePlayer animationData={orderFoodAnim} style={{ width: 200, height: 200, margin: '0 auto' }} />
        <p style={{ fontWeight: 600 }}>
          {paymentMethod === 'mpesa' ? 'Sending payment request...' : 'Placing your order...'}
        </p>
      </div>
    )
  }

  const { cart, items } = state
  const lineItems = Object.entries(cart).map(([id, qty]) => {
    const item = items.find((i) => i.id === id)
    return { ...item, qty }
  })
  const total = lineItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  async function placeOrder() {
    setError('')
    if (paymentMethod === 'mpesa' && !phone.match(/^2547\d{8}$/)) {
      setError('Enter phone as 2547XXXXXXXX')
      return
    }
    setPlacing(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const workerId = sessionData.session.user.id

    // Save phone to profile for next time (mpesa orders only, since cash orders don't need it)
    if (paymentMethod === 'mpesa') {
      await supabase.from('profiles').update({ phone_number: phone }).eq('id', workerId)
    }

    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        worker_id: workerId,
        total_amount: total,
        payment_method: paymentMethod,
        status: paymentMethod === 'mpesa' ? 'pending_payment' : 'awaiting_cash_verification',
      })
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      setPlacing(false)
      return
    }

    // 2. Create order_items
    const itemsToInsert = lineItems.map((i) => ({
      order_id: order.id,
      daily_menu_id: i.id,
      qty: i.qty,
      unit_price: i.price,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
    if (itemsError) {
      setError(itemsError.message)
      setPlacing(false)
      return
    }

    // 3. Trigger STK push only for mpesa orders. Cash orders skip straight to
    //    "awaiting_cash_verification" until a cook confirms cash was handed over.
    if (paymentMethod === 'mpesa') {
      const { error: fnError } = await supabase.functions.invoke('stk-push', {
        body: { order_id: order.id, phone, amount: total },
      })
      if (fnError) {
        setError('Payment request failed to send. You can retry from Order Status.')
      }
    }

    setPlacing(false)
    navigate(`/order-status/${order.id}`)
  }

  return (
    <div className="page" style={{ maxWidth: 500 }}>
      <h2>Your order</h2>
      {lineItems.map((i) => (
        <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {i.menu_master?.name} x{i.qty}
          </span>
          <span>KES {i.price * i.qty}</span>
        </div>
      ))}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Total</span>
        <span>KES {total}</span>
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>How will you pay?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={paymentMethod === 'mpesa' ? '' : 'secondary'}
            onClick={() => setPaymentMethod('mpesa')}
            style={{ flex: 1 }}
          >
            M-Pesa (STK push)
          </button>
          <button
            className={paymentMethod === 'cash' ? '' : 'secondary'}
            onClick={() => setPaymentMethod('cash')}
            style={{ flex: 1 }}
          >
            Pay in person
          </button>
        </div>

        {paymentMethod === 'mpesa' && (
          <input
            type="tel"
            placeholder="M-Pesa phone e.g. 254712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
          />
        )}

        {paymentMethod === 'cash' && (
          <div className="card" style={{ marginBottom: 8, fontSize: 14 }}>
            Your order will be held until a cook confirms you've paid in cash at the counter.
            Food won't start preparing until then.
          </div>
        )}

        {error && <p style={{ color: 'var(--roam-danger)' }}>{error}</p>}
        <button onClick={placeOrder} disabled={placing} style={{ width: '100%' }}>
          {placing
            ? paymentMethod === 'mpesa'
              ? 'Sending STK push...'
              : 'Placing order...'
            : paymentMethod === 'mpesa'
            ? 'Pay with M-Pesa'
            : 'Place order — pay at counter'}
        </button>
      </div>
    </div>
  )
}

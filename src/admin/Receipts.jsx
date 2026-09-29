import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import AdminNav from '../components/AdminNav'

// Simple text-based receipt download (no extra library needed).
// Swap buildReceiptText's output into jspdf later if you want a styled PDF.
export default function Receipts() {
  const [orders, setOrders] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    fetchOrders()
  }, [date])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select(
        'id, total_amount, status, mpesa_receipt_number, created_at, profiles!orders_worker_id_fkey(full_name, email), order_items(qty, unit_price, daily_menu(menu_master(name)))'
      )
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .eq('status', 'collected')
    setOrders(data || [])
  }

  function downloadReceipt(order) {
    const lines = [
      `CANTEENGO RECEIPT`,
      `Order ID: ${order.id}`,
      `Worker: ${order.profiles?.full_name} (${order.profiles?.email})`,
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      `M-Pesa receipt: ${order.mpesa_receipt_number || 'N/A'}`,
      ``,
      `Items:`,
      ...order.order_items.map(
        (oi) => `  ${oi.daily_menu?.menu_master?.name} x${oi.qty} @ KES ${oi.unit_price}`
      ),
      ``,
      `TOTAL: KES ${order.total_amount}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${order.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Header title="Admin dashboard" subtitle="Roam Canteen" />
      <AdminNav />
    <div className="page" style={{ maxWidth: 700 }}>
      <h2>Receipts</h2>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {orders.map((o) => (
        <div
          key={o.id}
          style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}
        >
          <span>
            {o.profiles?.full_name} — KES {o.total_amount}
          </span>
          <button onClick={() => downloadReceipt(o)}>Download</button>
        </div>
      ))}
      {orders.length === 0 && <p>No completed orders for this date.</p>}
    </div>
    </div>
  )
}

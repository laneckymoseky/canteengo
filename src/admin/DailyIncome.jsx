import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import AdminNav from '../components/AdminNav'

export default function DailyIncome() {
  const [total, setTotal] = useState(0)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetchToday()
  }, [])

  async function fetchToday() {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at, profiles(full_name)')
      .eq('status', 'collected')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    setOrders(data || [])
    setTotal((data || []).reduce((sum, o) => sum + Number(o.total_amount), 0))
  }

  return (
    <div>
      <Header title="Admin dashboard" subtitle="Roam Canteen" />
      <AdminNav />
    <div className="page">
      <h2>Today's income</h2>
      <h1>KES {total}</h1>
      <p>{orders.length} completed orders</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Worker</th>
            <th style={{ textAlign: 'left' }}>Time</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.profiles?.full_name}</td>
              <td>{new Date(o.created_at).toLocaleTimeString()}</td>
              <td style={{ textAlign: 'right' }}>KES {o.total_amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

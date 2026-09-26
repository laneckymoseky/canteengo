import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import AdminNav from '../components/AdminNav'

export default function StockTracking() {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchStock()
    const channel = supabase
      .channel('admin_stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_menu' }, fetchStock)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchStock() {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('daily_menu')
      .select('id, price, stock_qty, is_out_of_stock, menu_master(name, category)')
      .eq('date', today)
    setItems(data || [])
  }

  return (
    <div>
      <Header title="Admin dashboard" subtitle="Roam Canteen" />
      <AdminNav />
    <div className="page">
      <h2>Stock tracking (today)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock left</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} style={{ color: i.stock_qty <= 5 ? 'red' : 'inherit' }}>
              <td>{i.menu_master?.name}</td>
              <td style={{ textAlign: 'center' }}>{i.menu_master?.category}</td>
              <td style={{ textAlign: 'center' }}>KES {i.price}</td>
              <td style={{ textAlign: 'center' }}>{i.stock_qty}</td>
              <td style={{ textAlign: 'center' }}>{i.is_out_of_stock ? 'Out of stock' : 'Available'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

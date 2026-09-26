import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import CookNav from '../components/CookNav'

export default function StockManager() {
  const [dailyItems, setDailyItems] = useState([])
  const [masterItems, setMasterItems] = useState([])
  const [selectedMasterId, setSelectedMasterId] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')

  useEffect(() => {
    fetchDailyMenu()
    fetchMasterMenu()
  }, [])

  async function fetchDailyMenu() {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('daily_menu')
      .select('id, price, stock_qty, is_out_of_stock, menu_master(name)')
      .eq('date', today)
    setDailyItems(data || [])
  }

  async function fetchMasterMenu() {
    const { data } = await supabase.from('menu_master').select('*').eq('is_active', true)
    setMasterItems(data || [])
  }

  async function addToTodaysMenu() {
    if (!selectedMasterId || !price) return
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('daily_menu').insert({
      menu_master_id: selectedMasterId,
      date: today,
      price: Number(price),
      stock_qty: Number(stock) || 0,
    })
    setSelectedMasterId('')
    setPrice('')
    setStock('')
    fetchDailyMenu()
  }

  async function toggleOutOfStock(item) {
    await supabase
      .from('daily_menu')
      .update({ is_out_of_stock: !item.is_out_of_stock })
      .eq('id', item.id)
    fetchDailyMenu()
  }

  async function updateStockQty(item, newQty) {
    await supabase
      .from('daily_menu')
      .update({ stock_qty: newQty, is_out_of_stock: newQty <= 0 })
      .eq('id', item.id)
    fetchDailyMenu()
  }

  return (
    <div>
      <CookNav />
      <div className="page">
      <h2>Today's menu & stock</h2>

      <div style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc' }}>
        <h4>Add item to today's menu</h4>
        <select value={selectedMasterId} onChange={(e) => setSelectedMasterId(e.target.value)}>
          <option value="">Select from master menu...</option>
          {masterItems.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (base KES {m.base_price})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Price today"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ marginLeft: 8, width: 100 }}
        />
        <input
          type="number"
          placeholder="Stock qty"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={{ marginLeft: 8, width: 100 }}
        />
        <button onClick={addToTodaysMenu} style={{ marginLeft: 8 }}>
          Add
        </button>
      </div>

      {dailyItems.map((item) => (
        <div
          key={item.id}
          style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}
        >
          <span>
            {item.menu_master?.name} — KES {item.price}
          </span>
          <div>
            <input
              type="number"
              defaultValue={item.stock_qty}
              onBlur={(e) => updateStockQty(item, Number(e.target.value))}
              style={{ width: 60, marginRight: 8 }}
            />
            <button onClick={() => toggleOutOfStock(item)}>
              {item.is_out_of_stock ? 'Mark in stock' : 'Mark out of stock'}
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  )
}

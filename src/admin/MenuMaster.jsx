import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import AdminNav from '../components/AdminNav'

const CATEGORIES = ['breakfast', 'lunch', 'special', 'drink', 'featured']

export default function MenuMaster() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('lunch')
  const [basePrice, setBasePrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data } = await supabase.from('menu_master').select('*').order('category').order('name')
    setItems(data || [])
  }

  async function addItem() {
    if (!name || !basePrice) return
    await supabase.from('menu_master').insert({
      name,
      category,
      base_price: Number(basePrice),
      image_url: imageUrl || null,
    })
    setName('')
    setBasePrice('')
    setImageUrl('')
    fetchItems()
  }

  async function toggleActive(item) {
    await supabase.from('menu_master').update({ is_active: !item.is_active }).eq('id', item.id)
    fetchItems()
  }

  return (
    <div>
      <Header title="Admin dashboard" subtitle="Roam Canteen" />
      <AdminNav />
      <div className="page">
        <h2>Master menu catalog</h2>

        <div className="card" style={{ marginBottom: 24 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8, width: '100%' }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Base price"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          />
          <input
            placeholder="Image URL (optional, e.g. /food-images/breakfast/rolex.jpg)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
          />
          <button onClick={addItem}>Add to catalog</button>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}
          >
            <span>
              {item.name} <span className="badge">{item.category}</span> — KES {item.base_price}
            </span>
            <button className="secondary" onClick={() => toggleActive(item)}>
              {item.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

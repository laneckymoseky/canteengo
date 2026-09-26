import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import WorkerNav from '../components/WorkerNav'
import OnboardingTour from '../components/OnboardingTour'

const CATEGORIES = ['all', 'breakfast', 'lunch', 'special', 'drink', 'featured']

export default function Menu() {
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [recommended, setRecommended] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAt, setDismissedAt] = useState(null)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    fetchTodaysMenu()
    fetchRecommendations()
    fetchAnnouncements()
    checkTourStatus()

    const menuChannel = supabase
      .channel('daily_menu_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_menu' }, () =>
        fetchTodaysMenu()
      )
      .subscribe()

    const announceChannel = supabase
      .channel('announcements_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => setAnnouncements((prev) => [payload.new, ...prev])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(menuChannel)
      supabase.removeChannel(announceChannel)
    }
  }, [])

  async function fetchTodaysMenu() {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('daily_menu')
      .select('id, price, stock_qty, is_out_of_stock, menu_master (id, name, category, image_url)')
      .eq('date', today)
    if (!error) setItems(data)
    setLoading(false)
  }

  async function checkTourStatus() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_completed_tour')
      .eq('id', sessionData.session.user.id)
      .single()
    if (profile && !profile.has_completed_tour) setShowTour(true)
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
    setAnnouncements(data || [])
  }

  async function fetchRecommendations() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return
    const workerId = sessionData.session.user.id

    // Look at this worker's past orders, find which menu_master items they've ordered most
    const { data: pastItems } = await supabase
      .from('order_items')
      .select('daily_menu (menu_master_id), orders!inner(worker_id)')
      .eq('orders.worker_id', workerId)
      .limit(50)

    if (!pastItems) return
    const counts = {}
    pastItems.forEach((oi) => {
      const id = oi.daily_menu?.menu_master_id
      if (id) counts[id] = (counts[id] || 0) + 1
    })
    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)
    setRecommended(topIds)
  }

  function addToCart(id) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }
  function removeFromCart(id) {
    setCart((prev) => {
      const next = { ...prev }
      if (next[id] > 1) next[id] -= 1
      else delete next[id]
      return next
    })
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  const filteredItems = items.filter((item) => {
    const matchesCategory = category === 'all' || item.menu_master?.category === category
    const matchesSearch = item.menu_master?.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const recommendedItems = items.filter((item) => recommended.includes(item.menu_master?.id))

  function renderItemCard(item) {
    return (
      <div
        key={item.id}
        className="card"
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          opacity: item.is_out_of_stock ? 0.5 : 1,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-md)',
            background: item.menu_master?.image_url
              ? `url(${item.menu_master.image_url}) center/cover`
              : 'var(--roam-orange-tint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          {!item.menu_master?.image_url && '🍽️'}
        </div>

        <div style={{ flex: 1 }}>
          <strong style={{ fontFamily: 'var(--font-display)' }}>{item.menu_master?.name}</strong>
          <div style={{ color: 'var(--roam-charcoal)', fontSize: 14 }}>KES {item.price}</div>
          {item.is_out_of_stock && <span className="badge danger">Out of stock</span>}
          {!item.is_out_of_stock && item.stock_qty <= 5 && (
            <span className="badge">Only {item.stock_qty} left</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {cart[item.id] > 0 && (
            <>
              <button className="secondary" onClick={() => removeFromCart(item.id)} style={{ padding: '6px 12px' }}>
                −
              </button>
              <span style={{ minWidth: 16, textAlign: 'center' }}>{cart[item.id]}</span>
            </>
          )}
          <button onClick={() => addToCart(item.id)} disabled={item.is_out_of_stock} style={{ padding: '6px 14px' }}>
            +
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <p className="page">Loading menu...</p>

  const latestAnnouncement = announcements[0]
  const showBanner = latestAnnouncement && dismissedAt !== latestAnnouncement.id

  return (
    <div style={{ paddingBottom: cartCount > 0 ? 90 : 0 }}>
      {showTour && <OnboardingTour role="worker" onFinish={() => setShowTour(false)} />}
      <Header title="Today's menu" subtitle="Order now, skip the line at lunch" />
      <WorkerNav />

      <div className="page" style={{ paddingTop: 8 }}>
        {showBanner && (
          <div
            className="card"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginBottom: 16,
              background: 'var(--roam-orange-tint)',
              border: '1px solid var(--roam-orange)',
            }}
          >
            {latestAnnouncement.image_url && (
              <img
                src={latestAnnouncement.image_url}
                alt=""
                style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>📣 Announcement</strong>
              <p style={{ margin: '2px 0 0', fontSize: 14 }}>{latestAnnouncement.message}</p>
            </div>
            <button
              className="secondary"
              onClick={() => setDismissedAt(latestAnnouncement.id)}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              ✕
            </button>
          </div>
        )}

        <input
          placeholder="Search e.g. rice, chicken..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={category === cat ? '' : 'secondary'}
              style={{ whiteSpace: 'nowrap', padding: '6px 16px', fontSize: 14 }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {recommendedItems.length > 0 && category === 'all' && !search && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16 }}>You might like</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {recommendedItems.map(renderItemCard)}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>No menu set for today yet — check back later.</p>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>{filteredItems.map(renderItemCard)}</div>

        {items.length > 0 && filteredItems.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--roam-charcoal)' }}>
            No dishes match "{search}" in this category.
          </p>
        )}
      </div>

      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--roam-black)', padding: '14px 20px' }}>
          <Link to="/cart" state={{ cart, items }} style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '12px 20px' }}>
              <span>View cart · {cartCount} item{cartCount > 1 ? 's' : ''}</span>
              <span>KES {cartTotal}</span>
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

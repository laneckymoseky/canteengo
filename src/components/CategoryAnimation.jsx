import { useEffect, useState } from 'react'
import LottiePlayer from './LottiePlayer'

// Loaded on demand so the big animation files don't bloat the main bundle.
const LOADERS = {
  breakfast: () => import('../assets/animations/breakfast.json'),
  lunch: () => import('../assets/animations/lunch.json'),
  special: () => import('../assets/animations/special.json'),
  featured: () => import('../assets/animations/special.json'),
  drink: () => import('../assets/animations/drinks.json'),
}

// Plays once above the menu whenever the category changes, then collapses.
export default function CategoryAnimation({ category }) {
  const [data, setData] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let active = true
    setVisible(false)
    setData(null)
    const load = LOADERS[category]
    if (!load) return
    load().then((mod) => {
      if (!active) return
      setData(mod.default)
      setVisible(true)
    })
    return () => {
      active = false
    }
  }, [category])

  if (!data || !visible) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <LottiePlayer
        key={category}
        animationData={data}
        loop={false}
        onComplete={() => setVisible(false)}
        style={{ width: 180, height: 140 }}
      />
    </div>
  )
}

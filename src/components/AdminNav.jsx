import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Income', end: true },
  { to: '/admin/stock', label: 'Stock' },
  { to: '/admin/menu-master', label: 'Menu' },
  { to: '/admin/receipts', label: 'Receipts' },
  { to: '/admin/staff', label: 'Staff' },
]

export default function AdminNav() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 8,
        maxWidth: 700,
        margin: '0 auto',
        padding: '0 16px',
        flexWrap: 'wrap',
      }}
    >
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          style={({ isActive }) => ({
            textDecoration: 'none',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 14,
            fontWeight: 600,
            background: isActive ? 'var(--roam-orange)' : 'var(--roam-orange-tint)',
            color: isActive ? 'var(--roam-white)' : 'var(--roam-orange-dark)',
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}

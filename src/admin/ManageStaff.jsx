import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import AdminNav from '../components/AdminNav'

const ROLES = ['worker', 'cook', 'admin']

export default function ManageStaff() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPeople()
  }, [])

  async function fetchPeople() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department')
      .order('full_name')
    setPeople(data || [])
    setLoading(false)
  }

  async function changeRole(personId, newRole) {
    setSavingId(personId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', personId)

    if (!error) {
      setPeople((prev) =>
        prev.map((p) => (p.id === personId ? { ...p, role: newRole } : p))
      )
    } else {
      alert('Could not update role: ' + error.message)
    }
    setSavingId(null)
  }

  const filtered = people.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Header title="Manage staff" subtitle="Assign who can cook and who can administer" />
      <AdminNav />
      <div className="page" style={{ maxWidth: 700 }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 16 }}
        />

        {loading && <p>Loading staff list...</p>}

        {!loading && filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>No matching people found.</p>
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((person) => (
            <div
              key={person.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <strong style={{ fontFamily: 'var(--font-display)' }}>
                  {person.full_name || '(no name set)'}
                </strong>
                <div style={{ fontSize: 13, color: 'var(--roam-charcoal)' }}>{person.email}</div>
                {person.department && (
                  <span className="badge" style={{ marginTop: 4, display: 'inline-block' }}>
                    {person.department}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={person.role}
                  onChange={(e) => changeRole(person.id, e.target.value)}
                  disabled={savingId === person.id}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                {savingId === person.id && <span style={{ fontSize: 13 }}>Saving...</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

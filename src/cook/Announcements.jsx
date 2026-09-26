import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import CookNav from '../components/CookNav'

export default function Announcements() {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [posted, setPosted] = useState(false)

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function postAnnouncement() {
    if (!message.trim()) return
    setError('')
    setPosting(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const cookId = sessionData.session.user.id

    let imageUrl = null
    if (file) {
      const path = `announcements/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(path, file)
      if (uploadError) {
        setError('Image upload failed: ' + uploadError.message)
        setPosting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('public-images').getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('announcements').insert({
      posted_by: cookId,
      message: message.trim(),
      image_url: imageUrl,
    })

    setPosting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('')
    setFile(null)
    setPreview(null)
    setPosted(true)
    setTimeout(() => setPosted(false), 3000)
  }

  return (
    <div>
      <CookNav />
      <div className="page">
        <h2>Post an announcement</h2>
        <p style={{ color: 'var(--roam-charcoal)' }}>
          e.g. "New batch of samosas ready, get them fast!" — this shows up instantly on every
          worker's menu screen.
        </p>

        <div className="card">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement..."
            rows={3}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--roam-border)',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              marginBottom: 12,
            }}
          />

          {preview && (
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 12 }}
            />
          )}

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ marginBottom: 12, display: 'block' }}
          />

          {error && <p style={{ color: 'var(--roam-danger)' }}>{error}</p>}
          {posted && <p style={{ color: 'var(--roam-success)' }}>Posted!</p>}

          <button onClick={postAnnouncement} disabled={posting || !message.trim()}>
            {posting ? 'Posting...' : 'Post announcement'}
          </button>
        </div>
      </div>
    </div>
  )
}

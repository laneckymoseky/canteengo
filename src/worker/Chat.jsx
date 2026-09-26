import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Chat({ orderId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id))
    fetchMessages()

    const channel = supabase
      .channel(`chat_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `order_id=eq.${orderId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orderId])

  async function fetchMessages() {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    await supabase.from('chat_messages').insert({
      order_id: orderId,
      sender_id: userId,
      message: text.trim(),
    })
    setText('')
  }

  return (
    <div>
      <h3>Chat about this order</h3>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 8 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 4 }}>
            <strong>{m.sender_id === userId ? 'You' : 'Cook'}:</strong> {m.message}
          </div>
        ))}
        {messages.length === 0 && <p>No messages yet.</p>}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Shared presence channel: every cook viewing the order queue joins this one
// channel. Each cook broadcasts which single order_id (if any) they've
// claimed to work on. Supabase Presence auto-removes a cook's state the
// moment their browser disconnects/closes, so a claim never gets "stuck" —
// no cleanup job needed.
export default function useOrderPresence(cookId, cookName) {
  const [claimsByOrder, setClaimsByOrder] = useState({}) // { order_id: { cookId, cookName } }
  const [myClaim, setMyClaim] = useState(null)
  const channelRef = useRef(null)
  const myClaimRef = useRef(null) // mirrors myClaim, read inside the subscribe callback below

  useEffect(() => {
    if (!cookId) return

    const channel = supabase.channel('cook-order-presence', {
      config: { presence: { key: cookId } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const map = {}
      Object.entries(state).forEach(([key, metas]) => {
        const latest = metas[metas.length - 1]
        if (latest?.order_id) {
          map[latest.order_id] = { cookId: key, cookName: latest.cook_name }
        }
      })
      setClaimsByOrder(map)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ cook_name: cookName, order_id: myClaimRef.current })
      }
    })

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [cookId, cookName])

  function claimOrder(orderId) {
    myClaimRef.current = orderId
    setMyClaim(orderId)
    channelRef.current?.track({ cook_name: cookName, order_id: orderId })
  }

  function releaseOrder() {
    myClaimRef.current = null
    setMyClaim(null)
    channelRef.current?.track({ cook_name: cookName, order_id: null })
  }

  return { claimsByOrder, claimOrder, releaseOrder, myClaim }
}

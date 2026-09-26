// supabase/functions/stk-push/index.ts
// Deploy with: npx supabase functions deploy stk-push
// Requires secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_TILL_NUMBER, MPESA_PASSKEY,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (last two are auto-provided by Supabase)

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Use the sandbox host first; switch to https://api.safaricom.co.ke once you go live
const DARAJA_BASE = 'https://sandbox.safaricom.co.ke'

async function getAccessToken() {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!
  const auth = btoa(`${consumerKey}:${consumerSecret}`)

  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const data = await res.json()
  return data.access_token
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  )
}

serve(async (req) => {
  try {
    const { order_id, phone, amount } = await req.json()

    const tillNumber = Deno.env.get('MPESA_TILL_NUMBER')!
    const passkey = Deno.env.get('MPESA_PASSKEY')!
    const ts = timestamp()
    const password = btoa(`${tillNumber}${passkey}${ts}`)

    const accessToken = await getAccessToken()

    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: tillNumber,
        Password: password,
        Timestamp: ts,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: tillNumber,
        PhoneNumber: phone,
        CallBackURL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
        AccountReference: order_id,
        TransactionDesc: 'CanteenGo order',
      }),
    })

    const stkData = await stkRes.json()

    // Record the payment attempt
    await supabaseAdmin.from('payments').insert({
      order_id,
      checkout_request_id: stkData.CheckoutRequestID,
      merchant_request_id: stkData.MerchantRequestID,
      amount,
      status: 'initiated',
    })

    return new Response(JSON.stringify(stkData), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

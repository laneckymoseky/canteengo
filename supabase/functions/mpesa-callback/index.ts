// supabase/functions/mpesa-callback/index.ts
// This is the public URL you register with Daraja as CallBackURL.
// Deploy with: npx supabase functions deploy mpesa-callback --no-verify-jwt
// (--no-verify-jwt because Safaricom calling this endpoint has no Supabase auth token)

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const body = await req.json()
    const callback = body?.Body?.stkCallback

    if (!callback) {
      return new Response(JSON.stringify({ error: 'Malformed callback' }), { status: 400 })
    }

    const checkoutRequestId = callback.CheckoutRequestID
    const resultCode = callback.ResultCode // 0 = success

    // Find the matching payment row
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single()

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), { status: 404 })
    }

    if (resultCode === 0) {
      // Extract the M-Pesa receipt number from CallbackMetadata
      const metadata = callback.CallbackMetadata?.Item || []
      const receipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value

      await supabaseAdmin
        .from('payments')
        .update({ status: 'success', mpesa_receipt: receipt, raw_callback: body })
        .eq('id', payment.id)

      await supabaseAdmin
        .from('orders')
        .update({ status: 'preparing', mpesa_receipt_number: receipt })
        .eq('id', payment.order_id)
    } else {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed', raw_callback: body })
        .eq('id', payment.id)

      await supabaseAdmin
        .from('orders')
        .update({ status: 'payment_failed' })
        .eq('id', payment.order_id)
    }

    // Safaricom just needs a 200 OK acknowledgment
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

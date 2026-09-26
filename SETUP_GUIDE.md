# Cafeteria pre-order app — build guide

Suggested project name: **CanteenGo** (or **QuickChop**, **MealQueue** — pick whatever, used below as `canteengo`).
Suggested Supabase project name: `canteengo-db`.

## 1. Accounts to set up first

1. **Supabase** — supabase.com, new project named `canteengo-db`. Save your project URL and anon key (Settings > API).
2. **Safaricom Daraja** — developer.safaricom.co.ke, create an app, get your Consumer Key + Consumer Secret. Since you have a Till (Buy Goods) number, go for **Lipa Na M-Pesa Online** under the Daraja sandbox first, then apply for Go-Live to use your real Till.
3. **Node.js + npm** installed locally.

## 2. Create the React app

```bash
npm create vite@latest canteengo -- --template react
cd canteengo
npm install @supabase/supabase-js react-router-dom
```

## 3. Set up Supabase

1. In Supabase Dashboard → SQL Editor → paste and run `schema.sql` (the file next to this guide).
2. Dashboard → Authentication → Providers → enable Email. Under Auth settings, restrict sign-ups to your company email domain if you want (Auth Hooks or a check in your sign-up form: `email.endsWith('@yourcompany.com')`).
3. Dashboard → Authentication → Realtime is on by default; the schema already adds `orders`, `daily_menu`, `chat_messages` to the realtime publication.

Create `src/lib/supabaseClient.js`:
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Create `.env.local` in project root (never commit this):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Folder structure to create

```
src/
  lib/supabaseClient.js
  auth/
    Login.jsx
    Signup.jsx
    RequireRole.jsx        # route guard by role
  worker/
    Menu.jsx
    Cart.jsx
    OrderStatus.jsx
    Chat.jsx
  cook/
    OrderQueue.jsx          # tablet-facing, big touch targets
    StockManager.jsx
  admin/
    DailyIncome.jsx
    StockTracking.jsx
    Receipts.jsx
    MenuMaster.jsx
  App.jsx                   # routes + role-based redirect
```

Since the cook screen lives on a tablet at the counter, design `OrderQueue.jsx` with large buttons ("Mark preparing", "Mark ready") and auto-refreshing via a Supabase Realtime subscription rather than manual refresh.

## 5. M-Pesa integration (Supabase Edge Functions)

Install the Supabase CLI, then:
```bash
npx supabase functions new stk-push
npx supabase functions new mpesa-callback
```

Set secrets (never put these in frontend code):
```bash
npx supabase secrets set MPESA_CONSUMER_KEY=xxx MPESA_CONSUMER_SECRET=xxx MPESA_TILL_NUMBER=xxx MPESA_PASSKEY=xxx
```

`stk-push` function logic:
1. Receive `{ order_id, phone, amount }` from the frontend.
2. Get an OAuth token from Daraja (`/oauth/v1/generate`).
3. Call `/mpesa/stkpush/v1/processrequest` with `TransactionType: "CustomerBuyGoodsOnline"`, your Till as `BusinessShortCode` / `PartyB`, and the passkey-generated password.
4. Insert a row into `payments` with the returned `CheckoutRequestID`, set order status to `pending_payment`.

`mpesa-callback` function logic:
1. This is the public URL you register with Daraja as `CallBackURL`.
2. Safaricom POSTs the result here — parse `Body.stkCallback`.
3. On success: update `payments.status = 'success'`, save `mpesa_receipt`, set `orders.status = 'preparing'`.
4. On failure/cancel: `payments.status = 'failed'`, `orders.status = 'payment_failed'` (frontend shows "Retry payment").

Deploy:
```bash
npx supabase functions deploy stk-push
npx supabase functions deploy mpesa-callback
```

## 6. Order lifecycle to wire up

`pending_payment → preparing → ready_for_pickup → collected`, with `cancelled` / `payment_failed` branches.
- Worker can cancel only while `pending_payment`.
- Cook flips `preparing → ready_for_pickup` from the tablet.
- Cook flips `ready_for_pickup → collected` when the worker picks up (or worker confirms via their phone — your call).

## 7. Admin views

- **Daily income**: `select sum(total_amount) from orders where status='collected' and created_at::date = current_date`
- **Stock tracking**: read from `daily_menu`, join `menu_master`
- **Receipts**: generate a PDF client-side per order (e.g. with `jspdf`) pulling from `orders` + `order_items`; store a link or just let admin download on demand

## 8. Build order (suggested)

1. Auth (signup/login restricted to work email) + role-based routing
2. Admin: menu_master CRUD, set today's daily_menu
3. Worker: browse menu, cart, checkout (stub payment first)
4. Wire in real STK push + callback
5. Cook tablet view: order queue, status buttons, stock toggle
6. Chat per order
7. Admin dashboard: income, stock, receipts
8. Ratings, low-stock alerts, retry-payment flow

## 9. Where to run this from here

Since this is a real multi-file project with secrets and edge functions, build it in **Claude Code** (desktop or terminal) rather than in this chat — point it at these two files (`schema.sql` and this guide) and ask it to scaffold the Vite project structure above.

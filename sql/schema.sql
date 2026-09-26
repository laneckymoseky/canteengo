-- ============================================================
-- Cafeteria Pre-Order App — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'worker' check (role in ('worker','cook','admin')),
  department text,
  phone_number text, -- needed for STK push (2547XXXXXXXX format)
  has_completed_tour boolean default false,
  created_at timestamptz default now()
);

-- 2. MENU MASTER (permanent catalog cooks build "today's menu" from)
create table menu_master (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text, -- e.g. 'main', 'side', 'drink'
  base_price numeric(10,2) not null,
  image_url text, -- link to food photo, e.g. a Supabase Storage public URL
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 3. DAILY MENU (what's actually orderable today, with live stock)
create table daily_menu (
  id uuid primary key default gen_random_uuid(),
  menu_master_id uuid references menu_master(id) not null,
  date date not null default current_date,
  price numeric(10,2) not null, -- copied from base_price, editable per day
  stock_qty integer default 0,
  is_out_of_stock boolean default false,
  set_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (menu_master_id, date)
);

-- 4. ORDERS
create table orders (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references profiles(id) not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','awaiting_cash_verification','preparing','ready_for_pickup','collected','cancelled','payment_failed')),
  payment_method text not null default 'mpesa' check (payment_method in ('mpesa','cash')),
  verified_by uuid references profiles(id), -- cook who confirmed a cash payment
  verified_at timestamptz,
  pickup_time_slot text, -- e.g. '13:00-13:15'
  total_amount numeric(10,2) not null default 0,
  mpesa_receipt_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. ORDER ITEMS
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  daily_menu_id uuid references daily_menu(id) not null,
  qty integer not null check (qty > 0),
  unit_price numeric(10,2) not null
);

-- 6. PAYMENTS (STK push tracking)
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) not null,
  checkout_request_id text, -- from Daraja STK response
  merchant_request_id text,
  mpesa_receipt text,
  amount numeric(10,2) not null,
  status text not null default 'initiated'
    check (status in ('initiated','success','failed','timeout')),
  raw_callback jsonb,
  created_at timestamptz default now()
);

-- 7. CHAT MESSAGES (per order, worker <-> cook)
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  message text not null,
  created_at timestamptz default now()
);

-- 8b. ANNOUNCEMENTS (cook/admin posts like "New batch ready, get them fast!")
create table announcements (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid references profiles(id) not null,
  message text not null,
  image_url text,
  created_at timestamptz default now()
);

-- 8. RATINGS
create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) not null,
  worker_id uuid references profiles(id) not null,
  stars integer check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGER: auto-flag low stock (<=5 units) -> realtime picks this up
-- ============================================================
create or replace function check_low_stock()
returns trigger as $$
begin
  if new.stock_qty <= 5 and new.stock_qty > 0 then
    new.is_out_of_stock := false;
  elsif new.stock_qty <= 0 then
    new.is_out_of_stock := true;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_check_low_stock
before update on daily_menu
for each row execute function check_low_stock();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table menu_master enable row level security;
alter table daily_menu enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table chat_messages enable row level security;
alter table ratings enable row level security;
alter table announcements enable row level security;

-- Helper: is the current user a cook or admin?
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('cook','admin')
  );
$$ language sql security definer;

-- Helper: is the current user an admin? (security definer avoids RLS self-recursion)
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- profiles: everyone can read their own; staff can read all
create policy "read own profile" on profiles for select using (auth.uid() = id or is_staff());
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "admin updates any profile" on profiles for update using (is_admin());
create policy "insert own profile" on profiles for insert with check (auth.uid() = id);

-- menu_master: everyone reads active items; only staff write
create policy "read menu master" on menu_master for select using (true);
create policy "staff write menu master" on menu_master for all using (is_staff());

-- daily_menu: everyone reads; only staff write
create policy "read daily menu" on daily_menu for select using (true);
create policy "staff write daily menu" on daily_menu for all using (is_staff());

-- orders: workers see only their own; staff see all
create policy "worker reads own orders" on orders for select using (auth.uid() = worker_id or is_staff());
create policy "worker creates own orders" on orders for insert with check (auth.uid() = worker_id);
create policy "staff updates orders" on orders for update using (is_staff() or auth.uid() = worker_id);

-- order_items: visible if you can see the parent order
create policy "read order items" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.worker_id = auth.uid() or is_staff()))
);
create policy "insert order items" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.worker_id = auth.uid())
);

-- payments: worker sees own, staff sees all; writes happen via Edge Function (service role)
create policy "read own payments" on payments for select using (
  exists (select 1 from orders o where o.id = order_id and (o.worker_id = auth.uid() or is_staff()))
);

-- chat_messages: only participants (worker who owns order, or staff)
create policy "read chat" on chat_messages for select using (
  exists (select 1 from orders o where o.id = order_id and (o.worker_id = auth.uid() or is_staff()))
);
create policy "send chat" on chat_messages for insert with check (
  exists (select 1 from orders o where o.id = order_id and (o.worker_id = auth.uid() or is_staff()))
);

-- ratings: worker rates own order items; everyone can read (for popularity)
create policy "read ratings" on ratings for select using (true);
create policy "worker rates own" on ratings for insert with check (auth.uid() = worker_id);

-- announcements: everyone reads; only staff post
create policy "read announcements" on announcements for select using (true);
create policy "staff post announcements" on announcements for insert with check (is_staff());

-- ============================================================
-- REALTIME: enable for tables that need live updates
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table daily_menu;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table announcements;

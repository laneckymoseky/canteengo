-- Run this if you already ran the original schema.sql — adds cash-payment support.

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending_payment','awaiting_cash_verification','preparing','ready_for_pickup','collected','cancelled','payment_failed'));

alter table orders add column if not exists payment_method text not null default 'mpesa' check (payment_method in ('mpesa','cash'));
alter table orders add column if not exists verified_by uuid references profiles(id);
alter table orders add column if not exists verified_at timestamptz;

-- ============================================================
-- Mekoni Restaurant menu — seed data for menu_master
-- Run in Supabase SQL Editor. Safe to re-run (uses a name check to skip dupes).
-- ============================================================

insert into menu_master (name, category, base_price)
select * from (values
  -- BREAKFAST
  ('Chapo Plain', 'breakfast', 20),
  ('Mandazi', 'breakfast', 10),
  ('Kaimati', 'breakfast', 5),
  ('Sausages', 'breakfast', 50),
  ('Samosas Beef', 'breakfast', 50),
  ('Samosa Chicken', 'breakfast', 60),
  ('Smokie', 'breakfast', 40),
  ('Smocha (Chapo Smokie Wrap)', 'breakfast', 60),
  ('Rolex (Chapo Egg Wrap)', 'breakfast', 50),
  ('Boiled Egg', 'breakfast', 30),
  ('Fried Eggs (2)', 'breakfast', 70),
  ('Hot Dog', 'breakfast', 100),
  ('Mbaazi (1/2)', 'breakfast', 50),
  ('Omelette', 'breakfast', 100),

  -- LUNCH
  ('Dengu/Beans with Chapo/Rice', 'lunch', 100),
  ('Ugali with Matumbo', 'lunch', 120),
  ('Matoke Plain', 'lunch', 80),
  ('Chicken Tikka Masala with Naan/Rice', 'lunch', 300),
  ('Ugali with Beef & Greens', 'lunch', 150),
  ('Ugali with Beef & Cabbage', 'lunch', 140),
  ('Githeri & Kachumbari', 'lunch', 80),
  ('Half Pilau with Sauce & Kachumbari', 'lunch', 125),
  ('Full Pilau with Sauce & Kachumbari', 'lunch', 250),
  ('Viazi Karai with Ukwaju', 'lunch', 100),
  ('Chips', 'lunch', 100),
  ('Bhajia', 'lunch', 150),
  ('Chicken per pc (1/8)', 'lunch', 100),
  ('Chicken Tikka Masala Plain', 'lunch', 250),
  ('Rice Plain', 'lunch', 50),
  ('Beans Plain', 'lunch', 60),
  ('Ugali Plain', 'lunch', 40),
  ('Matumbo Plain', 'lunch', 80),
  ('Beef Plain', 'lunch', 120),
  ('Mboga Plain - Greens', 'lunch', 30),
  ('Mboga Plain - Cabbage', 'lunch', 20),
  ('Naan Plain', 'lunch', 35),
  ('Egg Curry with Rice', 'lunch', 100),
  ('Egg Curry Plain', 'lunch', 80),

  -- MEKONI SPECIALS (only on order)
  ('Chicken Tikka Masala (Served with Naan/Rice)', 'special', 500),
  ('Biriani Chicken with Special Mekoni Salad', 'special', 400),
  ('Chicken Tikka Choma (Served with Chips/Wedges) & Salad', 'special', 350),
  ('Foundation (Ugali, Fried Beef, Creamed Spinach & Salad)', 'special', 250),
  ('Pilau Mbuzi/Kuku (with Sauce and Kachumbari) with Banana', 'special', 300),

  -- DRINKS
  ('Ukwaju Juice', 'drink', 50),
  ('Sodas', 'drink', 50),
  ('Water', 'drink', 50),

  -- WEEKLY FEATURED DISHES (cooks activate the relevant one each day)
  ('Monday Special: Pilau', 'featured', 250),
  ('Tuesday Special: Biriyani', 'featured', 250),
  ('Wednesday Special: Tikka Masala with Naan', 'featured', 300),
  ('Thursday Special: Chicken Stew', 'featured', 200)
) as v(name, category, base_price)
where not exists (
  select 1 from menu_master m where m.name = v.name
);

-- Attaches lunch / specials / drinks photos to menu_master rows.
-- Run after seed_menu.sql. (Breakfast photos: update_breakfast_images.sql)

update menu_master set image_url = v.img
from (values
  -- LUNCH
  ('Dengu/Beans with Chapo/Rice', '/food-images/lunch/chapati-and-dengu.jpg'),
  ('Ugali with Matumbo', '/food-images/lunch/ugali-with-matumbo.jpg'),
  ('Matoke Plain', '/food-images/lunch/matoke-plain.jpg'),
  ('Chicken Tikka Masala with Naan/Rice', '/food-images/lunch/chicken-tikka-masala-with-rice.jpg'),
  ('Ugali with Beef & Cabbage', '/food-images/lunch/ugali-with-beef-and-cabbage.jpg'),
  ('Githeri & Kachumbari', '/food-images/lunch/githeri-plain.jpg'),
  ('Half Pilau with Sauce & Kachumbari', '/food-images/lunch/half-pilau-with-sauce-and-kachumbari.jpg'),
  ('Full Pilau with Sauce & Kachumbari', '/food-images/lunch/half-pilau-with-sauce-and-kachumbari.jpg'),
  ('Chips', '/food-images/lunch/chips.jpg'),
  ('Bhajia', '/food-images/lunch/bhajia.jpg'),
  ('Chicken per pc (1/8)', '/food-images/lunch/chicken-per-piece.jpg'),
  ('Chicken Tikka Masala Plain', '/food-images/lunch/chicken-tikka-masala-with-rice.jpg'),
  ('Rice Plain', '/food-images/lunch/rice-plain.jpg'),
  ('Beans Plain', '/food-images/lunch/beans-plain.jpg'),
  ('Ugali Plain', '/food-images/lunch/ugali-plain.jpg'),
  ('Matumbo Plain', '/food-images/lunch/matumbo-plain.jpg'),
  ('Beef Plain', '/food-images/lunch/beef-plain.jpg'),
  ('Mboga Plain - Cabbage', '/food-images/lunch/cabbage-plain.jpg'),
  ('Naan Plain', '/food-images/lunch/naan-plain.jpg'),
  ('Egg Curry with Rice', '/food-images/lunch/egg-curry-with-rice.jpg'),
  ('Egg Curry Plain', '/food-images/lunch/egg-curry-plain.jpg'),
  -- SPECIALS
  ('Chicken Tikka Masala (Served with Naan/Rice)', '/food-images/specials/chicken-tikka-with-naan.jpg'),
  ('Chicken Tikka Choma (Served with Chips/Wedges) & Salad', '/food-images/specials/chicken-tikka-with-chips-or-wedges-and-salad.jpg'),
  ('Foundation (Ugali, Fried Beef, Creamed Spinach & Salad)', '/food-images/specials/foundation.jpg'),
  ('Pilau Mbuzi/Kuku (with Sauce and Kachumbari) with Banana', '/food-images/specials/pilau-mbuzi-with-sauce-and-kachumbari.jpg'),
  -- FEATURED (weekly)
  ('Monday Special: Pilau', '/food-images/specials/pilau-monday-special.jpg'),
  ('Wednesday Special: Tikka Masala with Naan', '/food-images/specials/chicken-tikka-with-naan.jpg'),
  -- DRINKS
  ('Ukwaju Juice', '/food-images/drinks/ukwaju-juice.jpg'),
  ('Sodas', '/food-images/drinks/soda.jpg'),
  ('Water', '/food-images/drinks/water.jpg')
) as v(name, img)
where menu_master.name = v.name;

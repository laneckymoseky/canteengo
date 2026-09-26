-- Attaches the uploaded breakfast photos (now in /public/food-images/breakfast/)
-- to their matching menu_master rows. Run after seed_menu.sql.
-- These are relative paths served by the React app itself — works as-is in dev
-- and once deployed, since Vite serves everything in /public from the site root.

update menu_master set image_url = '/food-images/breakfast/chapati.jpg' where name = 'Chapo Plain';
update menu_master set image_url = '/food-images/breakfast/mandazi.jpg' where name = 'Mandazi';
update menu_master set image_url = '/food-images/breakfast/kaimati.jpg' where name = 'Kaimati';
update menu_master set image_url = '/food-images/breakfast/sausages.jpg' where name = 'Sausages';
update menu_master set image_url = '/food-images/breakfast/samosa-beef-or-chicken.jpg' where name = 'Samosas Beef';
update menu_master set image_url = '/food-images/breakfast/samosa-beef-or-chicken.jpg' where name = 'Samosa Chicken';
update menu_master set image_url = '/food-images/breakfast/smokie.jpg' where name = 'Smokie';
update menu_master set image_url = '/food-images/breakfast/smocha.jpg' where name = 'Smocha (Chapo Smokie Wrap)';
update menu_master set image_url = '/food-images/breakfast/rolex.jpg' where name = 'Rolex (Chapo Egg Wrap)';
update menu_master set image_url = '/food-images/breakfast/boiled-eggs.jpg' where name = 'Boiled Egg';
update menu_master set image_url = '/food-images/breakfast/fried-eggs.jpg' where name = 'Fried Eggs (2)';
update menu_master set image_url = '/food-images/breakfast/hotdog.jpg' where name = 'Hot Dog';
update menu_master set image_url = '/food-images/breakfast/omelette.jpg' where name = 'Omelette';

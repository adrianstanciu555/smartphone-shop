-- Seeds the 10 customers (docs/customer_data_original.csv) with addresses and purchase history.
-- Requires schema.sql and products.sql to be loaded first. Run once on a fresh database.
-- No credentials are stored in the repo: pass an Argon2 hash at run time, e.g.
--   psql -v customer_password_hash="'<argon2-hash>'" -f database/seeds/customer_data_original.sql
BEGIN;

-- ============================================================
-- users + default delivery address
-- ============================================================
CREATE TEMP TABLE customers_seed (
  id          uuid,
  name        text,
  email       text,
  phone       text,
  birthdate   date,
  country     char(2),
  status      user_status,
  line1       text,
  city        text,
  postal_code text
) ON COMMIT DROP;

INSERT INTO customers_seed VALUES
  ('3f6c1a52-8b1e-4d3a-9c47-1a2b3c4d5e01', 'Anna Petrova',     'anna.petrova@gmail.com',       '+44 7624 123456',   '1992-07-14', 'GB', 'active',      '221 Camden High Street',  'London',      'NW1 7JR'),
  ('7a9d2e64-5c0f-4b8e-a1d3-2b3c4d5e6f02', 'Mihai Ionescu',    'mihai.ionescu@yahoo.com',      '+40 721 345 678',   '1988-03-02', 'RO', 'active',      'Strada Victoriei 25',     'București',   '010065'),
  ('b81e3f75-6d1a-4c9f-b2e4-3c4d5e6f7a03', 'Lena Schneider',   'lena.schneider@web.de',        '+49 151 23456789',  '1999-11-23', 'DE', 'unverified',  'Kantstraße 12',           'Berlin',      '10623'),
  ('c92f4a86-7e2b-4dae-83f5-4d5e6f7a8b04', 'Carlos Fernández', 'carlos.fernandez@outlook.com', '+34 612 345 678',   '1975-05-30', 'ES', 'locked',      'Calle de Alcalá 45',      'Madrid',      '28014'),
  ('d03a5b97-8f3c-4ebf-94a6-5e6f7a8b9c05', 'Sophie Dubois',    'sophie.dubois@orange.fr',      '+33 6 12 34 56 78', '2001-01-09', 'FR', 'suspended',   '12 Rue de Rivoli',        'Paris',       '75004'),
  ('e14b6ca8-904d-4fc0-a5b7-6f7a8b9cad06', 'Ioana Marin',      'ioana.marin@gmail.com',        '+40 744 112 233',   '1995-09-18', 'RO', 'active',      'Bulevardul Unirii 18',    'Cluj-Napoca', '400098'),
  ('f25c7db9-a15e-40d1-b6c8-7a8b9cadbe07', 'James O''Connor',  'james.oconnor@outlook.com',    '+44 7911 654321',   '1983-12-05', 'GB', 'active',      '7 Princes Street',        'Edinburgh',   'EH2 2BY'),
  ('061d8eca-b26f-41e2-87d9-8b9cadbecf08', 'Marta Kowalska',   'marta.kowalska@wp.pl',         '+48 512 345 678',   '1990-04-27', 'PL', 'active',      'ul. Marszałkowska 84',    'Warszawa',    '00-514'),
  ('172e9fdb-c370-42f3-98ea-9cadbecfd009', 'Luca Rossi',       'luca.rossi@libero.it',         '+39 333 456 7890',  '1979-08-11', 'IT', 'active',      'Via Roma 10',             'Milano',      '20121'),
  ('283fa0ec-d481-4304-a9fb-adbecfd0e10a', 'Emma Johansson',   'emma.johansson@gmail.com',     '+46 70 123 45 67',  '2003-02-19', 'SE', 'active',      'Drottninggatan 33',       'Stockholm',   '111 51');

INSERT INTO users (id, email, password_hash, name, birthdate, phone, country, role, status,
                   email_verified_at, failed_login_count, locked_until)
SELECT id, email, :customer_password_hash, name, birthdate, phone, country, 'customer', status,
       CASE WHEN status <> 'unverified' THEN now() - interval '120 days' END,
       CASE WHEN status = 'locked' THEN 5 ELSE 0 END,
       CASE WHEN status = 'locked' THEN now() + interval '1 hour' END
FROM customers_seed;

INSERT INTO addresses (user_id, recipient, phone, line1, city, postal_code, country, is_default)
SELECT id, name, phone, line1, city, postal_code, country, true
FROM customers_seed;

-- ============================================================
-- purchase history (prices and SKUs come from the seeded products)
-- ============================================================
CREATE TEMP TABLE order_defs_seed (
  order_number bigint,
  email        text,
  status       order_status,
  days_ago     integer                                   -- age of the payment
) ON COMMIT DROP;

INSERT INTO order_defs_seed VALUES
  (100001, 'anna.petrova@gmail.com',       'delivered', 40),
  (100002, 'mihai.ionescu@yahoo.com',      'delivered', 60),
  (100003, 'carlos.fernandez@outlook.com', 'delivered', 90),
  (100004, 'sophie.dubois@orange.fr',      'returned',  75),
  (100005, 'ioana.marin@gmail.com',        'delivered', 50),
  (100006, 'james.oconnor@outlook.com',    'cancelled', 20),
  (100007, 'marta.kowalska@wp.pl',         'delivered', 35),
  (100008, 'mihai.ionescu@yahoo.com',      'shipped',    3),
  (100009, 'luca.rossi@libero.it',         'delivered', 25),
  (100010, 'emma.johansson@gmail.com',     'paid',       1);

CREATE TEMP TABLE order_lines_seed (
  order_number bigint,
  product_name text,
  quantity     integer
) ON COMMIT DROP;

INSERT INTO order_lines_seed VALUES
  (100001, 'Google Pixel 8 128GB', 1),
  (100001, 'Techsuit Rugged Case for Pixel 8', 1),
  (100001, 'Belkin Anti-Glare Film for Pixel 8', 1),
  (100002, 'Samsung Galaxy S24 256GB', 1),
  (100002, 'Spigen Clear Case for Galaxy S24', 1),
  (100003, 'Xiaomi Redmi Note 13 128GB', 1),
  (100003, 'Ringke Clear Case for Redmi Note 13', 1),
  (100004, 'Samsung Bluetooth Headphones White', 1),
  (100005, 'Apple iPhone 15 512GB', 1),
  (100005, 'Spigen Slim Case for iPhone 15', 1),
  (100005, 'UGREEN USB-C to Lightning Cable 2m White', 2),
  (100006, 'Sony Xperia 1 V 512GB', 1),
  (100007, 'UGREEN 20W USB-C Charger Black', 1),
  (100007, 'Anker USB-C to Lightning Cable 2m Black', 1),
  (100008, 'Anker 65W GaN Charger White', 1),
  (100009, 'Anker ANC Headphones Blue', 1),
  (100010, 'Nillkin Privacy Glass for Galaxy S24', 1),
  (100010, 'Spigen Clear Case for Galaxy S24', 1);

INSERT INTO orders (order_number, user_id, idempotency_key, status, delivery_method, shipping_address,
                    subtotal, tax_total, shipping_total, total,
                    paid_at, shipped_at, delivered_at, cancelled_at, created_at)
SELECT d.order_number, u.id, gen_random_uuid(), d.status, 'standard',
       jsonb_build_object('recipient', a.recipient, 'phone', a.phone, 'line1', a.line1, 'city', a.city,
                          'postalCode', a.postal_code, 'country', a.country),
       t.subtotal, t.tax_total,
       CASE WHEN t.subtotal >= 50 THEN 0 ELSE 4.99 END,   -- standard: free from 50.00, otherwise 4.99
       t.subtotal + CASE WHEN t.subtotal >= 50 THEN 0 ELSE 4.99 END,
       now() - d.days_ago * interval '1 day',
       CASE WHEN d.status IN ('shipped', 'delivered', 'returned')
            THEN now() - (d.days_ago - 1) * interval '1 day' END,
       CASE WHEN d.status IN ('delivered', 'returned')
            THEN now() - (d.days_ago - 4) * interval '1 day' END,
       CASE WHEN d.status = 'cancelled' THEN now() - (d.days_ago - 1) * interval '1 day' END,
       now() - d.days_ago * interval '1 day'
FROM order_defs_seed d
JOIN users u     ON u.email = d.email
JOIN addresses a ON a.user_id = u.id AND a.is_default
JOIN LATERAL (
  SELECT sum(p.price * l.quantity) AS subtotal,
         -- prices include tax, so tax is extracted: line_total * rate / (100 + rate), rounded per line
         sum(round(p.price * l.quantity * p.tax_rate / (100 + p.tax_rate), 2)) AS tax_total
  FROM order_lines_seed l
  JOIN products p ON p.name = l.product_name
  WHERE l.order_number = d.order_number
) t ON true;

INSERT INTO order_items (order_id, product_id, product_name, sku, unit_price, tax_rate, quantity, line_total)
SELECT o.id, p.id, p.name, p.sku, p.price, p.tax_rate, l.quantity, p.price * l.quantity
FROM order_lines_seed l
JOIN orders o   ON o.order_number = l.order_number
JOIN products p ON p.name = l.product_name;

INSERT INTO payments (order_id, provider_payment_intent, status, amount, currency)
SELECT o.id, 'pi_seed_' || o.order_number,
       CASE WHEN o.status IN ('returned', 'cancelled') THEN 'refunded' ELSE 'succeeded' END::payment_status,
       o.total, o.currency
FROM orders o
WHERE o.order_number BETWEEN 100001 AND 100010;

INSERT INTO order_status_history (order_id, from_status, to_status, note)
SELECT id, 'pending', status, 'seed data'
FROM orders
WHERE order_number BETWEEN 100001 AND 100010;

-- keep generated order numbers after the seeded ones
SELECT setval('order_number_seq', 100010);

COMMIT;

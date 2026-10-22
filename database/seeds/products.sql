-- Loads docs/products-seed.csv (name,category,price,rating,availability).
-- Run from the repo root with psql (\copy is a psql meta-command).
BEGIN;

CREATE TEMP TABLE products_seed (
  name         text,
  category     text,
  price        numeric(10,2),
  rating       numeric(2,1),
  availability boolean
) ON COMMIT DROP;

\copy products_seed FROM 'docs/products-seed.csv' WITH (FORMAT csv, HEADER true)

INSERT INTO brands (name, slug)
SELECT b, lower(replace(b, ' ', '-'))
FROM unnest(ARRAY['Samsung','Apple','Google','Motorola','Xiaomi','OPPO','HONOR','Sony','Vivo','OnePlus',
                  'Anker','Belkin','Spigen','Techsuit','UGREEN','HOCO','McDodo','Baseus','Ringke',
                  'Nillkin','PanzerGlass','Urban Armor Gear','JBL','Philips']) AS b
ON CONFLICT (name) DO NOTHING;

-- Brand = longest brand name that prefixes the product name; SKU derived from the name.
WITH src AS (
  SELECT s.*,
         (SELECT b.id FROM brands b
           WHERE s.name LIKE b.name || ' %'
           ORDER BY length(b.name) DESC LIMIT 1) AS brand_id
  FROM products_seed s
), ins AS (
  INSERT INTO products (sku, name, brand_id, category, price, tax_rate, rating)
  SELECT upper(regexp_replace(name, '[^A-Za-z0-9]+', '-', 'g')),
         name, brand_id, category::product_category, price, 5.00, rating   -- 5% tax included in price
  FROM src
  RETURNING id, name
)
INSERT INTO stock_levels (product_id, quantity_on_hand)
SELECT i.id, CASE WHEN s.availability THEN 50 ELSE 0 END   -- placeholder quantity for available items
FROM ins i JOIN products_seed s ON s.name = i.name;

COMMIT;

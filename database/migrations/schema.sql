-- Smartphone Shop - PostgreSQL schema
-- Modules follow backend/src: auth, users, catalog, cart, checkout, orders,
-- inventory, shipping, notifications, admin.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Enums
-- ============================================================
-- admin: full back office access, incl. user/role management and audit log review
CREATE TYPE user_role           AS ENUM ('customer', 'catalog_manager', 'support_agent', 'admin');
CREATE TYPE user_status         AS ENUM ('unverified', 'active', 'locked', 'suspended', 'deleted');
CREATE TYPE product_category    AS ENUM ('smartphone', 'case', 'charger', 'cable', 'headphones', 'screen_protector');
CREATE TYPE cart_status         AS ENUM ('active', 'converted', 'abandoned');
CREATE TYPE delivery_method     AS ENUM ('standard', 'express');
CREATE TYPE order_status        AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered',
                                         'cancelled', 'return_requested', 'returned', 'refunded',
                                         'payment_failed');
CREATE TYPE payment_status      AS ENUM ('pending', 'requires_action', 'succeeded', 'failed',
                                         'cancelled', 'refunded', 'partially_refunded');
CREATE TYPE reservation_status  AS ENUM ('active', 'committed', 'released', 'expired');
CREATE TYPE stock_move_type     AS ENUM ('restock', 'reserve', 'release', 'deduct', 'return', 'adjustment');
CREATE TYPE shipment_status     AS ENUM ('created', 'in_transit', 'out_for_delivery', 'delivered', 'failed');
CREATE TYPE return_status       AS ENUM ('requested', 'approved', 'rejected', 'received', 'refunded');
CREATE TYPE refund_status       AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE notification_channel AS ENUM ('email', 'sms');
CREATE TYPE notification_status  AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE token_type          AS ENUM ('email_verification', 'password_reset');
CREATE TYPE consent_type        AS ENUM ('terms', 'privacy', 'cookies', 'marketing');

-- Shared updated_at trigger
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- auth / users
-- ============================================================
CREATE TABLE users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 citext NOT NULL UNIQUE CHECK (length(email) <= 254),
  password_hash         text NOT NULL,                 -- Argon2
  name                  text NOT NULL CHECK (length(name) <= 100),
  birthdate             date,
  phone                 text,
  country               char(2),
  role                  user_role   NOT NULL DEFAULT 'customer',
  status                user_status NOT NULL DEFAULT 'unverified',
  email_verified_at     timestamptz,
  failed_login_count    integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until          timestamptz,
  last_login_at         timestamptz,
  deleted_at            timestamptz,                   -- GDPR deletion (anonymized)
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users (role);

CREATE TABLE user_tokens (                             -- email verification, password reset
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        token_type NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_tokens_user ON user_tokens (user_id, type);

CREATE TABLE refresh_tokens (                          -- JWT refresh tokens
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE user_consents (                           -- GDPR / cookie consent
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        consent_type NOT NULL,
  granted     boolean NOT NULL,
  version     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_consents_user ON user_consents (user_id, type);

CREATE TABLE addresses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient     text NOT NULL,
  phone         text NOT NULL,
  line1         text NOT NULL,
  line2         text,
  city          text NOT NULL,
  postal_code   text NOT NULL,
  country       char(2) NOT NULL,
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON addresses (user_id);
CREATE UNIQUE INDEX uq_addresses_default ON addresses (user_id) WHERE is_default;

-- ============================================================
-- catalog
-- ============================================================
CREATE TABLE brands (
  id    serial PRIMARY KEY,
  name  text NOT NULL UNIQUE,
  slug  text NOT NULL UNIQUE
);

CREATE TABLE products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku            text NOT NULL UNIQUE,
  name           text NOT NULL,
  description    text,
  brand_id       integer NOT NULL REFERENCES brands(id),
  category       product_category NOT NULL,                   -- GET /categories
  price          numeric(10,2) NOT NULL CHECK (price >= 0),   -- includes taxes
  currency       char(3) NOT NULL DEFAULT 'EUR',
  tax_rate       numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  rating         numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  popularity     integer NOT NULL DEFAULT 0 CHECK (popularity >= 0),  -- sort=popularity
  specs          jsonb NOT NULL DEFAULT '{}'::jsonb,          -- string -> string map
  is_active      boolean NOT NULL DEFAULT true,
  search_vector  tsvector GENERATED ALWAYS AS
                   (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_brand      ON products (brand_id);
CREATE INDEX idx_products_category   ON products (category);
CREATE INDEX idx_products_price      ON products (price);
CREATE INDEX idx_products_search     ON products USING gin (search_vector);
CREATE INDEX idx_products_name_trgm  ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_specs      ON products USING gin (specs);

CREATE TABLE product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,                           -- S3 + CloudFront
  alt_text    text,
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product ON product_images (product_id, position);

-- API "compatibleWith": phone models an accessory fits (e.g. 'iPhone 15')
CREATE TABLE product_compatibility (
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  phone_model  text NOT NULL,
  PRIMARY KEY (product_id, phone_model)
);
CREATE INDEX idx_compat_model ON product_compatibility (phone_model);

CREATE TABLE price_history (
  id          bigserial PRIMARY KEY,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price   numeric(10,2) NOT NULL,
  new_price   numeric(10,2) NOT NULL,
  changed_by  uuid REFERENCES users(id),
  changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_price_history_product ON price_history (product_id, changed_at DESC);

-- ============================================================
-- inventory
-- ============================================================
CREATE TABLE stock_levels (
  product_id           uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand     integer NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved    integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available   integer GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  low_stock_threshold  integer NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity_reserved <= quantity_on_hand)        -- prevents overselling
);

-- API Product.availability (seed CSV "availability" = in_stock/low_stock vs out_of_stock)
CREATE VIEW product_availability AS
SELECT p.id AS product_id,
       CASE
         WHEN coalesce(s.quantity_available, 0) <= 0 THEN 'out_of_stock'
         WHEN s.quantity_available <= s.low_stock_threshold THEN 'low_stock'
         ELSE 'in_stock'
       END AS availability,
       coalesce(s.quantity_available, 0) > 0 AS is_available
FROM products p
LEFT JOIN stock_levels s ON s.product_id = p.id;

CREATE TABLE stock_movements (
  id           bigserial PRIMARY KEY,
  product_id   uuid NOT NULL REFERENCES products(id),
  type         stock_move_type NOT NULL,
  quantity     integer NOT NULL CHECK (quantity <> 0),
  reason       text,                                   -- PUT /admin/inventory/{id} reason
  reference    text,                                   -- order id, etc.
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_product ON stock_movements (product_id, created_at DESC);

CREATE TABLE low_stock_alerts (
  id           bigserial PRIMARY KEY,
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity     integer NOT NULL,
  threshold    integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);
CREATE INDEX idx_low_stock_open ON low_stock_alerts (product_id) WHERE resolved_at IS NULL;

-- ============================================================
-- cart (one per account; Redis used as cache)
-- ============================================================
CREATE TABLE carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      cart_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_carts_active_user ON carts (user_id) WHERE status = 'active';

CREATE TABLE cart_items (
  cart_id     uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  quantity    integer NOT NULL CHECK (quantity > 0),
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cart_id, product_id)                    -- price is never stored; read server-side
);

-- ============================================================
-- orders / checkout / payments
-- ============================================================
CREATE SEQUENCE order_number_seq START 100000;

CREATE TABLE orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number       bigint NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
  user_id            uuid NOT NULL REFERENCES users(id),
  cart_id            uuid UNIQUE REFERENCES carts(id),  -- one order per cart: blocks duplicates
  idempotency_key    uuid NOT NULL,                     -- Idempotency-Key header
  status             order_status NOT NULL DEFAULT 'pending',
  delivery_method    delivery_method NOT NULL,
  shipping_address   jsonb NOT NULL,                    -- snapshot of address
  subtotal           numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_total          numeric(10,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  discount_total     numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  shipping_total     numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
  total              numeric(10,2) NOT NULL CHECK (total >= 0),
  currency           char(3) NOT NULL DEFAULT 'EUR',
  paid_at            timestamptz,
  shipped_at         timestamptz,
  delivered_at       timestamptz,                       -- starts the 30-day return window
  cancelled_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX idx_orders_user    ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status  ON orders (status);

CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id),
  product_name  text NOT NULL,                          -- snapshot
  sku           text NOT NULL,
  unit_price    numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate      numeric(5,2) NOT NULL DEFAULT 0,
  quantity      integer NOT NULL CHECK (quantity > 0),
  line_total    numeric(10,2) NOT NULL CHECK (line_total >= 0),
  UNIQUE (order_id, product_id)
);

CREATE TABLE order_status_history (
  id           bigserial PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  order_status,
  to_status    order_status NOT NULL,
  changed_by   uuid REFERENCES users(id),               -- NULL = system / webhook
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_status_history_order ON order_status_history (order_id, created_at);

CREATE TABLE stock_reservations (                       -- transactional reservation at checkout
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id),
  quantity    integer NOT NULL CHECK (quantity > 0),
  status      reservation_status NOT NULL DEFAULT 'active',
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);
CREATE INDEX idx_reservations_expiry ON stock_reservations (expires_at) WHERE status = 'active';

CREATE TABLE payments (                                 -- no card data stored (PCI DSS)
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  uuid NOT NULL REFERENCES orders(id),
  provider                  text NOT NULL DEFAULT 'stripe',
  provider_payment_intent   text NOT NULL UNIQUE,
  status                    payment_status NOT NULL DEFAULT 'pending',
  amount                    numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency                  char(3) NOT NULL DEFAULT 'EUR',
  failure_code              text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments (order_id);

CREATE TABLE payment_webhook_events (                   -- idempotent webhook handling
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id  text NOT NULL UNIQUE,
  type               text NOT NULL,
  payload            jsonb NOT NULL,
  received_at        timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz,
  error              text
);

-- ============================================================
-- returns and refunds
-- ============================================================
CREATE TABLE returns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id),
  status        return_status NOT NULL DEFAULT 'requested',
  reason        text NOT NULL,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  handled_by    uuid REFERENCES users(id),
  decision_note text,
  handled_at    timestamptz
);
CREATE INDEX idx_returns_order ON returns (order_id);

CREATE TABLE return_items (
  return_id      uuid NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id  uuid NOT NULL REFERENCES order_items(id),
  quantity       integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (return_id, order_item_id)
);

CREATE TABLE refunds (                                  -- back to the original payment method
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          uuid NOT NULL REFERENCES payments(id),
  order_id            uuid NOT NULL REFERENCES orders(id),
  return_id           uuid REFERENCES returns(id),
  provider_refund_id  text UNIQUE,
  amount              numeric(10,2) NOT NULL CHECK (amount > 0),
  reason              text,
  status              refund_status NOT NULL DEFAULT 'pending',
  created_by          uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_order ON refunds (order_id);

-- ============================================================
-- shipping
-- ============================================================
CREATE TABLE shipments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id),
  carrier          text NOT NULL,
  tracking_number  text UNIQUE,
  status           shipment_status NOT NULL DEFAULT 'created',
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_order ON shipments (order_id);

CREATE TABLE shipment_events (
  id           bigserial PRIMARY KEY,
  shipment_id  uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status       shipment_status NOT NULL,
  description  text,
  location     text,
  occurred_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipment_events_shipment ON shipment_events (shipment_id, occurred_at);

-- ============================================================
-- notifications (email / SMS)
-- ============================================================
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  channel     notification_channel NOT NULL,
  template    text NOT NULL,                             -- e.g. order_confirmation, shipped, low_stock
  recipient   text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status      notification_status NOT NULL DEFAULT 'queued',
  attempts    integer NOT NULL DEFAULT 0,
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user   ON notifications (user_id);
CREATE INDEX idx_notifications_queued ON notifications (created_at) WHERE status = 'queued';

-- ============================================================
-- admin / common
-- ============================================================
CREATE TABLE audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action       text NOT NULL,                            -- e.g. product.update, order.status_change
  entity_type  text NOT NULL,
  entity_id    text NOT NULL,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address   inet,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor  ON audit_log (actor_id, created_at DESC);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_addresses_updated  BEFORE UPDATE ON addresses    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated   BEFORE UPDATE ON products     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_stock_updated      BEFORE UPDATE ON stock_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carts_updated      BEFORE UPDATE ON carts        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated     BEFORE UPDATE ON orders       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated   BEFORE UPDATE ON payments     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shipments_updated  BEFORE UPDATE ON shipments    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

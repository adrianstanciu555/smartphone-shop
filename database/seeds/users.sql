-- Seeds one active staff account per back-office role (synthetic data only).
-- No credentials are stored in the repo: pass an Argon2 hash at run time, e.g.
--   psql -v staff_password_hash="'<argon2-hash>'" -f database/seeds/users.sql
BEGIN;

INSERT INTO users (email, password_hash, name, role, status, email_verified_at)
VALUES
  ('admin@smartphone-shop.test',   :staff_password_hash, 'Test Admin',           'admin',           'active', now()),
  ('catalog@smartphone-shop.test', :staff_password_hash, 'Test Catalog Manager', 'catalog_manager', 'active', now()),
  ('support@smartphone-shop.test', :staff_password_hash, 'Test Support Agent',   'support_agent',   'active', now())
ON CONFLICT (email) DO NOTHING;

COMMIT;

# Local PostgreSQL for smartphone-shop (Docker + VS Code PostgreSQL extension + MCP)

## Why Docker
- Clean setup: one command gives PostgreSQL 16 with the `citext` and `pg_trgm` extensions the schema needs.
- Disposable: `docker rm -f smartphone-pg` and re-run gives a fresh database in seconds.
- No leftovers on your machine; removal is one command plus `docker volume rm smartphone-pgdata`.
- Reproducible: the pinned `postgres:16` image behaves the same everywhere.
- Includes `psql`, so no separate client install.
- Downsides: large install, needs WSL 2/virtualization, uses background RAM, and Docker Desktop licensing may require a paid plan for larger companies.

## What is psql
`psql` is PostgreSQL's official command-line client. It runs SQL queries and script files.

| Command | Purpose |
|---|---|
| `\dt` | List tables |
| `\d products` | Describe a table |
| `\l` | List databases |
| `\q` | Quit |

With Docker you can use the copy inside the container:
```powershell
docker exec -it smartphone-pg psql -U shop -d smartphone_shop
```

## 1. Install Docker Desktop
1. Run `winget install Docker.DockerDesktop`, or install from docker.com.
2. Restart if prompted, then start Docker Desktop and wait for "Engine running".
3. In a new terminal, check with `docker --version`.

## 2. Start PostgreSQL in Docker
Run from the repo root:
```powershell
docker run -d --name smartphone-pg `
  -e POSTGRES_USER=shop -e POSTGRES_PASSWORD=shop_local_pw -e POSTGRES_DB=smartphone_shop `
  -p 5432:5432 -v smartphone-pgdata:/var/lib/postgresql/data `
  -v "${PWD}\database\migrations\schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro" `
  postgres:16
```
- The last `-v` auto-loads the schema on first start only.
- Check with `docker ps` and `docker logs smartphone-pg` ("ready to accept connections", no schema errors).
- Reset from scratch: `docker rm -f smartphone-pg; docker volume rm smartphone-pgdata`, then run the command again.
- After a reboot, use `docker start smartphone-pg` (do not re-run `docker run`).

## 3. VS Code PostgreSQL extension (Microsoft)
1. Install **PostgreSQL** by Microsoft (`ms-ossdata.vscode-pgsql`) from Extensions (`Ctrl+Shift+X`).
2. Click the elephant icon in the Activity Bar, then **Add Connection**.
3. Choose the parameters option and enter:
   - Server: `localhost`
   - Port: `5432`
   - Database: `smartphone_shop`
   - User: `shop`
   - Password: `shop_local_pw`
   - Connection name: `smartphone-local`
4. Connect and expand the connection to see schemas and tables.
5. Right-click the database, choose **New Query**, and run `SELECT * FROM products LIMIT 5;`.
6. Load seeds by opening `database/seeds/products.sql` and `database/seeds/customer_data_original.sql` and running each against `smartphone-local`. If one fails on a foreign key, try the other order.
   - `database/seeds/users.sql` needs a password hash variable, so use psql:
     `psql -v staff_password_hash="'<argon2-hash>'" -f database/seeds/users.sql`

## 4. PostgreSQL MCP server via `.vscode/mcp.json`
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "pg_url",
      "description": "PostgreSQL connection URL",
      "password": true
    }
  ],
  "servers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "${input:pg_url}"]
    }
  }
}
```
1. Open `mcp.json` and click **Start** above `"postgres"`.
2. When prompted, enter `postgresql://shop:shop_local_pw@localhost:5432/smartphone_shop`.
3. Verify with **MCP: List Servers** in the Command Palette. Requires Node.js.

This server is read-only (`SELECT` only). Use the extension or `psql` for inserts and updates, or a different MCP server (for example `postgres-mcp`) with a restricted role for writes.

## 5. Use it in Copilot Chat
In Agent mode, make sure the `postgres` tools are enabled, then try:
- "List all tables in smartphone_shop."
- "Show the 5 cheapest products."
- "Count orders by status."

Keep to synthetic data and local-only credentials; do not commit passwords.

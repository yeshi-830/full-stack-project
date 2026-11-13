# Memberdesk

A responsive member directory for registering and managing a community. The React dashboard reads and writes members through an Express API backed by MySQL.

## What it does

- View real member totals, recent sign-ups, and a seven-day registration chart.
- Add, edit, and remove members; duplicate email addresses are rejected.
- Search members by name or email, sort the directory, and export the visible results to CSV.
- Switch between light and dark themes; the preference is saved in the browser.
- Adapt the directory, navigation, and forms to desktop, tablet, and mobile screens.

The app's existing data model contains only a name, email, and registration date. It does not have authentication, roles, passwords, or an activity/notification store.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite 8 toolchain)
- MySQL 8+
- npm

## Set up the database

Create the database if it does not already exist:

```sql
CREATE DATABASE full_stack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Apply the schema in [`backend/schema.sql`](backend/schema.sql) to that database. For example, from a terminal with the MySQL command-line client installed:

```text
mysql -u root -p full_stack_db < backend/schema.sql
```

If you already have the `users` table, keep your data; `CREATE TABLE IF NOT EXISTS` does not replace an existing table.

## Configure and run

1. Copy `backend/.env.example` to `backend/.env` and set your MySQL connection details.
2. In one terminal, install and start the API:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. In a second terminal, install and start the web app:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (by default, `http://localhost:5173`). Vite proxies `/api` requests to `http://localhost:5000`.

The backend requires an available MySQL database and the `users` table before it starts. Set `PORT` to change the API port. Set `API_PROXY_TARGET` in the frontend environment if the API runs somewhere other than `http://localhost:5000`. Set `CORS_ORIGINS` to a comma-separated list of allowed browser origins when calling the API directly; the default is `http://localhost:5173`.

## Checks

Run the backend's validation and API tests:

```bash
cd backend
npm test
```

Build and lint the frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Production and security

The current app is a member directory, **not an authenticated account system**: it stores no passwords or roles, and the member list and write endpoints do not require a login. Do not expose it to untrusted users or deploy it with personal member data until you add authentication, authorization, and an appropriate privacy policy. CORS is not an access-control mechanism. Production hosting also needs HTTPS, a production database, and a frontend/API deployment configured for the same origin or the correct API URL.

## Project layout

```text
backend/
  schema.sql          MySQL users-table schema
  server.js           Express API and MySQL connection pool
  server.test.js      API input validation tests
frontend/
  src/App.jsx         Dashboard, member directory, and CRUD interactions
  src/App.css         Responsive components and theme styles
  src/index.css       Global styles
```

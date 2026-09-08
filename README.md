# WhatsApp Business Automation Platform

```
whatshap_boat/
  frontend/     React + Vite UI
  backend/      Express API, Sequelize, job worker
  package.json  workspace scripts
```

## Setup

1. Start MySQL in XAMPP.
2. Copy env files:

```bash
copy .env.example .env
copy .env.example frontend\.env
copy .env.example backend\.env
```

3. Install and migrate:

```bash
npm install
npm run db:migrate
```

4. Run both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/health

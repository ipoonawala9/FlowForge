# FlowForge

A self-hosted workflow automation platform built with Node.js, React, MySQL, and Redis. Users can visually build automated pipelines with conditional branching, scheduled triggers, multi-channel notifications (Email, WhatsApp), and non-blocking delay nodes backed by a Redis job queue.

Inspired by Zapier and n8n.

---

## Features

- **Visual drag-and-drop canvas** — build workflows by connecting nodes
- **Conditional branching** — condition nodes with true/false paths
- **Webhook triggers** — fire workflows from external HTTP requests
- **Schedule triggers** — run workflows on a CRON expression (daily, hourly, weekly)
- **Delay nodes** — pause execution for seconds, minutes, or hours without blocking the server
- **Send Email** — via Gmail SMTP / Nodemailer
- **WhatsApp messages** — via Twilio API
- **HTTP Request** — call any external API with SSRF protection
- **Google OAuth** — sign in with Google
- **Run history** — every execution is logged with status and duration
- **JWT authentication** — stateless, secure

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, React Flow |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| Queue | BullMQ + Redis 7 |
| Auth | JWT, bcryptjs, Passport.js (Google OAuth) |
| Email | Nodemailer (Gmail SMTP) |
| WhatsApp | Twilio API |
| Scheduling | node-cron |
| Containerisation | Docker |

---

## Project Structure

```
FlowForge/
├── backend/
│   ├── actions/          # Action modules (email, whatsapp, http, condition)
│   ├── config/           # DB connection pool and schema
│   ├── controllers/      # Request/response handlers
│   ├── middleware/        # Auth, rate limiting, logging, validation
│   ├── queue/            # BullMQ queue and worker
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic and DB queries
│   ├── validators/       # express-validator rules
│   ├── app.js            # Express app setup
│   └── server.js         # Entry point
└── frontend/
    └── src/
        ├── api/          # Axios instance with auth interceptor
        ├── components/   # Reusable UI components and canvas nodes
        ├── context/      # React Context for auth state
        ├── layout/       # Sidebar and dashboard layout
        └── pages/        # Login, Register, Dashboard, WorkflowBuilder, Settings
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for MySQL and Redis)

### 1. Start the database and Redis

```bash
# MySQL
docker run -d --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=flowforge \
  -p 3306:3306 \
  mysql:8

# Redis
docker run -d --name flowforge-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 2. Set up the database schema

```bash
docker exec -i mysql-dev mysql -u root -proot flowforge < backend/config/schema.sql
```

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values (see `.env.example`).

### 4. Install dependencies and start the backend

```bash
cd backend
npm install
node server.js
```

### 5. Install dependencies and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

Create `backend/.env` based on this template:

```env
PORT=3000
JWT_SECRET=your-long-random-secret

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=flowforge

REDIS_HOST=localhost
REDIS_PORT=6379

# Gmail App Password — https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password

# Twilio — https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google OAuth — https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

---

## License

MIT

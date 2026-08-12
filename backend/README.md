# VeriStaff Backend

Backend API for **VeriStaff — Multi-Tenant HR Operations & Employee Document Verification Platform**.

## Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM 7
- JWT authentication
- bcryptjs
- Zod validation
- QRCode
- Helmet / CORS

## Requirements

Use a supported Node.js LTS release. Prisma 7 currently requires Node.js 20.19+, 22.12+, or 24+.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create PostgreSQL database

Create a database named:

```text
veristaff
```

### 3. Configure environment

Copy:

```text
.env.example
```

to:

```text
.env
```

and update `DATABASE_URL` and `JWT_SECRET`.

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Create database tables

```bash
npm run prisma:migrate -- --name init
```

### 6. Seed demo data

```bash
npm run prisma:seed
```

### 7. Start backend

```bash
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/health
```

## Demo login

```text
Email: admin@veristaff.local
Password: Admin@12345
```

Change this password before any real deployment.

## API groups

```text
POST   /api/v1/auth/register-tenant
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/tenant
PATCH  /api/v1/tenant/branding

GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/employees/:id
PATCH  /api/v1/employees/:id
POST   /api/v1/employees/:id/resign

POST   /api/v1/onboarding/invite
POST   /api/v1/onboarding/validate/:token
POST   /api/v1/onboarding/complete/:token

GET    /api/v1/clearances/:employeeId
PATCH  /api/v1/clearances/:employeeId/:department

POST   /api/v1/documents

GET    /api/v1/verify-doc/:hash
```

## Architecture note

The original VeriStaff specification describes Next.js as a unified full-stack application. This repository intentionally separates the API into a `backend` service so the frontend can consume a clean REST API. The database model and core workflows remain aligned with the specification.

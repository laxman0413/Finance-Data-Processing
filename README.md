# Finance Data Processing and Access Control Backend

A RESTful backend for a finance dashboard system supporting financial records management, role-based access control, and dashboard analytics — built with **Node.js**, **Express**, and **SQLite**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Financial Records](#financial-records)
  - [Dashboard Summary](#dashboard-summary)
- [Role Permissions](#role-permissions)
- [Response Format](#response-format)
- [Technical Decisions and Trade-offs](#technical-decisions-and-trade-offs)
- [Assumptions](#assumptions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite via `better-sqlite3` |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Validation | `express-validator` |
| Rate Limiting | `express-rate-limit` |
| Testing | Jest + Supertest |

---

## Features

- ✅ User registration and login with JWT authentication
- ✅ Role-based access control: `viewer`, `analyst`, `admin`
- ✅ User management (admin: create, update role/status, deactivate)
- ✅ Financial records CRUD (income / expense entries)
- ✅ Record filtering by type, category, date range, with pagination
- ✅ Soft-delete for financial records
- ✅ Dashboard APIs: totals, category breakdowns, recent records, monthly trends
- ✅ Input validation with descriptive error messages
- ✅ Rate limiting on all routes (stricter on auth endpoints)
- ✅ Consistent JSON response format across all endpoints

---

## Project Structure

```
.
├── app.js                        # Express app setup, middleware, routes
├── server.js                     # Entry point — starts HTTP server
├── package.json
├── src/
│   ├── config/
│   │   └── database.js           # SQLite init, schema, DB accessor
│   ├── controllers/
│   │   ├── authController.js     # register, login
│   │   ├── userController.js     # CRUD for users
│   │   ├── recordController.js   # CRUD for financial records
│   │   └── dashboardController.js# Summary, trends, analytics
│   ├── middleware/
│   │   ├── auth.js               # JWT verification middleware
│   │   └── roles.js              # Role-based access control middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── dashboard.js
│   └── validators/
│       ├── authValidators.js
│       ├── userValidators.js
│       └── recordValidators.js
└── tests/
    ├── auth.test.js
    ├── users.test.js
    ├── records.test.js
    └── dashboard.test.js
```

---

## Setup and Installation

```bash
# Clone the repo
git clone https://github.com/laxman0413/Finance-Data-Processing.git
cd Finance-Data-Processing

# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the root (optional for development, required for production):

```env
PORT=3000
JWT_SECRET=your-very-long-random-secret-here
NODE_ENV=development
```

> **Note:** In production, `JWT_SECRET` **must** be set or the server will refuse to start.

---

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload via nodemon)
npm run dev
```

The server starts on `http://localhost:3000` by default.

---

## Running Tests

```bash
npm test
```

All 41 tests across 4 suites should pass. Tests use a separate `test.db` SQLite file.

---

## API Reference

All endpoints return JSON with the [standard response format](#response-format).  
Protected routes require `Authorization: Bearer <token>` header.

### Authentication

#### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secret@123"
}
```
Password requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.

New users are assigned the `viewer` role by default.

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "role": "viewer" }
  }
}
```

---

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "Secret@123"
}
```

---

### User Management

> All endpoints require `admin` role.

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create a user with specified role |
| PUT | `/api/users/:id` | Update role and/or status |
| DELETE | `/api/users/:id` | Deactivate user (sets status to inactive) |

**Create user body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "Password1!",
  "role": "analyst"
}
```

**Update user body:**
```json
{
  "role": "admin",
  "status": "active"
}
```

---

### Financial Records

> Roles: viewer/analyst/admin can read; analyst/admin can create and update; admin only can delete.

| Method | Path | Description |
|---|---|---|
| GET | `/api/records` | List records (with filters and pagination) |
| GET | `/api/records/:id` | Get a single record |
| POST | `/api/records` | Create a record |
| PUT | `/api/records/:id` | Update a record |
| DELETE | `/api/records/:id` | Soft-delete a record |

**Query parameters for GET /api/records:**

| Param | Type | Description |
|---|---|---|
| `type` | `income` \| `expense` | Filter by type |
| `category` | string | Filter by category |
| `startDate` | `YYYY-MM-DD` | Start of date range |
| `endDate` | `YYYY-MM-DD` | End of date range |
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 20, max: 100) |

**Create/update record body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-03-15",
  "notes": "Monthly salary"
}
```

---

### Dashboard Summary

> viewer/analyst/admin can access all except monthly trends (analyst/admin only).

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance |
| GET | `/api/dashboard/category-totals` | Income and expense totals by category |
| GET | `/api/dashboard/recent` | Most recent 10 records |
| GET | `/api/dashboard/monthly-trends` | Monthly income vs expense for last 12 months |

**Summary response example:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "totalExpenses": 32000,
    "netBalance": 18000,
    "recordCount": 45
  }
}
```

**Monthly trends response example:**
```json
{
  "success": true,
  "data": [
    { "month": "2024-03", "income": 5000, "expenses": 3200, "net": 1800 }
  ]
}
```

> Monthly trends return data for the past 12 months.

---

## Role Permissions

| Action | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| Login / Register | ✅ | ✅ | ✅ |
| View records | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View monthly trends | ❌ | ✅ | ✅ |
| Create / Update records | ❌ | ✅ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Response Format

All responses follow a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Description of the error"
}
```

**Validation error:**
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Must be a valid email address" }
  ]
}
```

**HTTP status codes used:**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Technical Decisions and Trade-offs

### Database: SQLite
SQLite was chosen for simplicity and zero-configuration setup. For a production system with concurrent writes at scale, PostgreSQL or MySQL would be more appropriate. `better-sqlite3` is used for its synchronous API which integrates cleanly with Express and results in simpler, less error-prone code.

### Authentication: JWT (stateless)
JWTs are used for stateless authentication. This avoids maintaining server-side sessions. The trade-off is that tokens cannot be invalidated before expiry without a token blacklist. The user status check on every request (verifying the user exists and is active in the DB) mitigates some risk.

### Soft Deletes
Financial records use soft deletes (`is_deleted = 1`) rather than hard deletes to preserve data integrity and audit history. Deleted records are excluded from all queries and summaries.

### Roles Model
Three roles are defined: `viewer`, `analyst`, `admin`. This is enforced at the route middleware level using a `requireRoles()` factory, keeping access control logic centralized and explicit.

### Rate Limiting
Rate limiting is applied globally and more strictly on auth endpoints to mitigate brute-force attacks. Limits are relaxed during tests.

### Password Policy
Passwords require a minimum of 8 characters with uppercase, lowercase, digit, and special character to enforce basic strength.

---

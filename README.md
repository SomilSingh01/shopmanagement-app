# 🛍️ Shop Manager — Enterprise Shop & Manufacturing Management Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Application-success?style=for-the-badge&logo=vercel)](https://shopmanagement-app.vercel.app)
[![API Status](https://img.shields.io/badge/Backend-Render%20Cloud-blue?style=for-the-badge&logo=render)](https://shopmanagement-app-4w7y.onrender.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL%20(TiDB)-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com/)

A modern, full-stack, enterprise-grade Shop & Manufacturing Management application (ERP/MRP) designed to handle retail inventory, production workflows, order dispatching, and customer CRM in real-time.

---

## 🌐 Live Deployments

- 🚀 **Production Application:** [https://shopmanagement-app.vercel.app](https://shopmanagement-app.vercel.app)
- ⚡ **Backend API Endpoint:** [https://shopmanagement-app-4w7y.onrender.com](https://shopmanagement-app-4w7y.onrender.com)
- 📂 **Source Code:** [https://github.com/SomilSingh01/shopmanagement-app](https://github.com/SomilSingh01/shopmanagement-app)

---

## ✨ Key Features

### 1. 📊 Executive Dashboard & Analytics
- Live visual overview of shop performance, gross revenue, and pending vs. completed orders.
- Dynamic historical revenue charts with multiple date filter ranges (7 days, 30 days, 90 days).
- Real-time inventory alerts highlighting products running low on stock.

### 2. 🏭 Manufacturing Execution (MES) & Bill of Materials (BOM)
- Track production from raw components to finished goods.
- Multi-component Bill of Materials (BOM) management.
- Stage-based workflow tracking: **Pending** ➔ **In Progress** ➔ **Quality Check** ➔ **Completed**.
- Automatically deducts raw material inventory upon order initiation.

### 3. 📦 Real-time Inventory Management
- Categorized product inventory tracking with SKU, stock quantity, and pricing.
- Instant modal/drawer product creation and rapid inline stock updates.
- Visual low-stock warning chips and restock threshold warnings.

### 4. 🛒 Orders & Automated Invoicing
- Full order lifecycle tracking: **Pending**, **Processing**, **Dispatched**, **Delivered**, and **Cancelled**.
- Itemized invoicing system with automatic subtotal, tax calculation, and discounts.
- Printable, clean invoice presentation for customer fulfillment.

### 5. 👥 Customer Relationship Management (CRM)
- Customer directory with contact details, shipping addresses, and transaction histories.
- Instant client drawer creation directly within the checkout/order flow.

### 6. 🔐 Hardened Security & Authentication
- **Two-Factor Email OTP Verification**: Powered by Brevo SMTP for secure email verification during signup and password recovery.
- **Brute-Force Protection**: Server-enforced rate limiter with automatic 5-attempt lockout (5-minute cooldown) returning HTTP 429.
- **Cross-Domain Session Security**: HttpOnly `SameSite=None` secure cookies linking frontend (Vercel) and backend (Render).
- **Zero-Trust Input Validation**: All incoming requests validated at API boundaries via Zod schemas and HTML/XSS sanitization.

### 7. 🎨 Mobile-First Responsive Design & Theming
- Fully responsive layout optimized for desktop, tablet, and mobile screens.
- Persistent header and bottom navigation for mobile PWA ergonomics.
- Multi-theme engine supporting **Light Mode** (default), **Dark Mode**, and **Ocean Blue**.

---

## 🏗️ System Architecture

The application is structured following clean **N-Tier Architecture**:

```
[ Client: React + Vite + TailwindCSS ]
                 │ (HTTPS / CORS / HttpOnly Cookies)
                 ▼
[ Controller Layer: Express Routes & Zod Validation ]
                 │
                 ▼
[ Service Layer: Business Logic, Rate Limiters, Brevo SMTP ]
                 │
                 ▼
[ Data Access Layer: Prisma ORM Connection Pool ]
                 │
                 ▼
[ Database: TiDB Cloud Serverless MySQL (TLS/SSL Strict) ]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Radix UI, Lucide Icons, Recharts, Framer Motion, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Nodemailer, Zod, Helmet, Cookie-Parser |
| **Database** | MySQL (Hosted on TiDB Cloud Serverless with TLS strict verification) |
| **Email Service** | Brevo SMTP via Port 2525 |
| **DevOps / Hosting** | Vercel (Frontend CI/CD), Render (Backend Service), GitHub Actions |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- MySQL or Docker (optional for local DB)

### 1. Clone the Repository
```bash
git clone https://github.com/SomilSingh01/shopmanagement-app.git
cd shop-management-app
```

### 2. Backend Setup
```bash
cd shop-backend
npm install
```

Create a `.env` file in `shop-backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/shop_management"
JWT_SECRET="your_secure_random_jwt_secret"
JWT_REFRESH_SECRET="your_secure_random_refresh_secret"

# Brevo SMTP Configuration
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=2525
SMTP_USER="your-brevo-login@smtp-brevo.com"
SMTP_PASS="your-brevo-smtp-key"
SMTP_SENDER="your-verified-email@example.com"
```

Run database migrations & start the backend:
```bash
npx prisma db push
npm run dev
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd shop-frontend
npm install
```

Create a `.env` file in `shop-frontend/`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the frontend development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/send-otp` | Generate & dispatch 6-digit verification code |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP code |
| `POST` | `/api/v1/auth/register` | Register new user & provision shop |
| `POST` | `/api/v1/auth/login` | Authenticate user (rate-limited, 5 attempts max) |
| `GET` | `/api/v1/dashboard/stats` | Retrieve shop revenue, orders & stock metrics |
| `GET` | `/api/v1/products` | Paginated product list with search/filter |
| `POST` | `/api/v1/products` | Create new inventory item |
| `GET` | `/api/v1/manufacturing` | List manufacturing orders and assembly statuses |
| `POST` | `/api/v1/orders` | Create customer order with line items |
| `GET` | `/api/v1/customers` | Query customer list and balances |

---

## 👤 Author

**Somil Singh**  
- Portfolio / GitHub: [@SomilSingh01](https://github.com/SomilSingh01)
- Live Project: [https://shopmanagement-app.vercel.app](https://shopmanagement-app.vercel.app)

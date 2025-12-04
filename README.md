# PharmaCore Enterprise ERP

A full-stack Enterprise Resource Planning (ERP) system for Pharmacy Management. 
Built with **Next.js** (Frontend), **NestJS** (Backend), and **PostgreSQL** (Database).

## 🌐 Live Demo
* **App Dashboard:** [https://pharma-inventory-core.vercel.app](https://pharma-inventory-core.vercel.app)
* **API Documentation:** [https://pharma-inventory-core.onrender.com/api](https://pharma-inventory-core.onrender.com/api)

---

## 🚀 Key Features

### 1. Role-Based Access Control (RBAC)
* **Super Admin:** User management, System audit (No access to Salary/Stock data).
* **HR Manager:** Hiring/Firing (Soft Delete), Salary Management, Performance Leaderboards.
* **Store Manager:** Warehouse Inventory, Goods Receipt (GRN), Stock Transfer Approval.
* **Pharmacist:** POS System, Product Search, Shopping Cart, Sales History.

### 2. Advanced Inventory Logic
* **Multi-Location Support:** Separate tracking for **Warehouse** vs. **Shop Floor**.
* **FIFO Logic:** First-In-First-Out sales based on batch expiry dates.
* **Safety Checks:** Automatic blocking of expired drug sales.
* **Transfer Workflow:** Warehouse -> Transfer Manifest -> Shop Stock.

### 3. Reporting & Analytics
* **PDF Generation:** Auto-generated stock and sales reports.
* **Data Visualization:** Weekly sales trend charts.
* **Swagger API:** Full OpenAPI documentation available at `/api`.

---

## 🛠️ Tech Stack
* **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons, Axios.
* **Backend:** NestJS, Prisma ORM, Passport JWT, Swagger.
* **Database:** PostgreSQL (via Render Cloud).

---

## 🔐 Test Credentials (Live App)
**Universal Password:** `123456`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Super Admin** | `admin@pharmacy.com` | Create Users, Audit Logs (No Salary View) |
| **HR Manager** | `hr@pharmacy.com` | Hire/Fire, Edit Salary, View Leaderboard |
| **Store Manager** | `store@pharmacy.com` | Receive Stock, Approve Transfers, View Warehouse |
| **Pharmacist** | `pharm@pharmacy.com` | Sell Drugs (POS), View Shop Stock |

---

## ⚡ Local Development Setup

### 1. Backend Setup
```bash
cd backend
npm install
# Start Database (Ensure Docker is running)
docker-compose up -d
# Run Migrations & Seed Data
npx prisma migrate dev
npx ts-node prisma/seed.ts
# Start Server
npm run start:dev
```

### 2. Frontend Setup
```bash

cd frontend
npm install
npm run de
```
---
© License
Private Enterprise Edition. Built for educational portfolio purposes.

### 🚀 How to Push this Update

Run these 3 commands in your **Root Terminal**:

```bash
# 1. Overwrite the file with the text above (Paste the text into README.md first)
# Or manually create the file and paste the content.

# 2. Stage the file
git add README.md

# 3. Commit and Push
git commit -m "Docs: Updated README with Live Demo links and Test Credentials"
git push
```
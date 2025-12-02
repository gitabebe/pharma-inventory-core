# PharmaCore: Advanced FIFO Inventory Engine

A full-stack pharmacy management dashboard designed to solve the critical problem of medication expiry. This system uses a strict **First-In-First-Out (FIFO)** algorithm to ensure that the oldest stock batches are sold before newer ones, reducing inventory waste.

![Dashboard Preview](https://via.placeholder.com/1000x500?text=Place+Your+Dashboard+Screenshot+Here)

## 🚀 Key Features

* **FIFO Batch Tracking:** The backend automatically identifies and deducts stock from the batch nearest to expiration.
* **Real-Time Dashboard:** Next.js frontend updates inventory levels instantly upon sale.
* **Automated Integrity:** Unit tests verify that inventory calculations are mathematically perfect.
* **Secure Architecture:** Environment-variable based configuration with Docker-ready setup.

## 🛠️ Tech Stack

* **Backend:** NestJS (Node.js), TypeScript, Prisma ORM
* **Frontend:** Next.js 14 (App Router), TailwindCSS, Lucide Icons
* **Database:** PostgreSQL
* **Testing:** Jest

## 🧪 How to Run (Local Dev)

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/gitabebe/pharma-inventory-core.git
cd pharma-inventory-core
\`\`\`

**2. Start the Infrastructure (Docker)**
\`\`\`bash
docker-compose up -d db
\`\`\`

**3. Install Dependencies**
\`\`\`bash
# Backend
cd backend && npm install
npx prisma migrate dev --name init

# Frontend
cd ../frontend && npm install
\`\`\`

**4. Run the Stack**
\`\`\`bash
# Terminal 1 (Backend)
cd backend && npm run start:dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
\`\`\`

## 🧩 The FIFO Logic (Code Highlight)
The core business logic resides in `inventory.service.ts`. It performs a transactional split of sales across multiple batches:

\`\`\`typescript
// Example: Selling 15 units when [Batch A: 10] and [Batch B: 10] exist.
// Result: Batch A becomes 0, Batch B becomes 5.
const amountToTake = Math.min(batch.quantity, remainingToSell);
await tx.batch.update({
  where: { id: batch.id },
  data: { quantity: batch.quantity - amountToTake },
});
\`\`\`

## ✅ Testing
This project includes automated unit tests to verify the FIFO logic.
\`\`\`bash
cd backend
npm test
\`\`\`
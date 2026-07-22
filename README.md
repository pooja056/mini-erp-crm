# Mini ERP + CRM Operations Portal

Full-Stack Wholesale/Distribution Operations Management Portal built with **React + TypeScript**, **Node.js + Express + TypeScript**, **PostgreSQL / Prisma ORM**, and **JWT Role-Based Access Control (RBAC)**.

---

## 🔐 Test Login Credentials (All 4 Roles)

All accounts are pre-seeded and ready for instant testing:

| Role | Email | Password | Allowed Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `password123` | Full administrative control across all modules, products, customers, stock adjustments & challans. |
| **Sales** | `sales@company.com` | `password123` | Customer CRM management, adding follow-up notes, generating draft & confirmed sales challans. |
| **Warehouse** | `warehouse@company.com` | `password123` | Product inventory management, stock IN/OUT adjustments, stock movement audit trail, challan stock verification. |
| **Accounts** | `accounts@company.com` | `password123` | View customer detail billing info, sales challans revenue, payment follow-up notes, PDF invoice exports. |

> 💡 **Quick Switch Tip**: The login screen features **1-Click Quick Login** buttons for all 4 roles.

---

## 🛠️ Tech Stack & Key Libraries

- **Frontend**: React 18, TypeScript, Vite, React Router DOM v6, Lucide React Icons, HTML2Canvas & jsPDF (for PDF Invoices), Modern Styled Executive CSS Design System.
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JSON Web Tokens (JWT), bcryptjs, Zod (Schema validation).
- **Database**: PostgreSQL (with SQLite compatibility out-of-the-box via Prisma provider).
- **API Architecture**: REST APIs with JWT Bearer Token middleware, status codes, search/filter, pagination, and atomic database transactions.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone & Setup Backend
```bash
cd backend
npm install

# Initialize Prisma Database & Seed default test data
npx prisma db push
npm run prisma:seed

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

### 2. Setup & Launch Frontend
Open a second terminal window:
```bash
cd frontend
npm install

# Start frontend dev server (Runs on http://localhost:5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## ⚙️ How Environment Variables Are Managed

Backend `.env` file (`backend/.env`):
```env
PORT=5000
DATABASE_URL="file:./dev.db" # Or PostgreSQL: "postgresql://user:password@localhost:5432/minierp?schema=public"
JWT_SECRET="mini_erp_crm_super_secret_jwt_key_2026"
NODE_ENV="development"
```

To switch to **PostgreSQL** (e.g. Supabase, Neon, Render Postgres):
1. Update `provider = "postgresql"` in `backend/prisma/schema.prisma`.
2. Set `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string.
3. Run `npx prisma db push && npm run prisma:seed`.

---

## 📊 Core Business Flow & Module Summary

### 1. Customer CRM Module
- Attributes: Name, Mobile, Email, Business Name, GST Number, Customer Type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), Address, Status (`LEAD`, `ACTIVE`, `INACTIVE`), Follow-up Date, Notes.
- Search & filter by keyword, customer type, or lead status.
- Customer Detail Page with an interactive **CRM Follow-Up Notes Timeline**, keeping an audit history of user interactions.

### 2. Product & Inventory Module
- Attributes: Product Name, Unique SKU, Category, Unit Price, Current Stock, Min Stock Alert Threshold, Warehouse Location.
- Visual **Low Stock Badges** alerting when stock falls below minimum threshold.
- Stock IN / Stock OUT modal with reason logging.
- **Stock Movement Log** tracking: Product, Qty Changed, Movement Type (`IN` / `OUT`), Reason, Created By User, and Timestamp.

### 3. Sales Challan Module & Inventory Logic
- Automatic generation of Challan Numbers (e.g. `CH-20260722-0001`).
- Multi-product line item selection with live subtotal & total quantity calculation.
- **Product Snapshot Data**: Line items store a snapshot of product name, SKU, and unit price at time of challan creation so price modifications in the catalog do not corrupt past financial records.
- **Atomic Stock Deduction**: When status changes to `CONFIRMED`:
  - Stock is atomically checked and decremented.
  - If stock is insufficient for any item, the API rejects with HTTP `400 Bad Request` specifying the exact stock shortage.
  - Automatically logs an `OUT` stock movement entry.
- **Export PDF / Print Invoice**: View formal printable PDF invoice with custom business header, customer snapshot, line items, and signature block.

---

## 📮 Postman Collection & API Documentation

A Postman API collection is included in the project root: `postman_collection.json`.

### Key REST Endpoints:
- `POST /api/auth/login` - User authentication & JWT issuance
- `GET /api/auth/me` - Validate current token & role
- `GET /api/dashboard/stats` - Summary business metrics
- `GET /api/customers` - List & search customers
- `POST /api/customers` - Create customer
- `POST /api/customers/:id/notes` - Append follow-up note
- `GET /api/products` - List products & stock levels
- `POST /api/products/:id/adjust-stock` - Record manual Stock IN / OUT
- `GET /api/stock-logs` - View stock movement audit log
- `GET /api/challans` - List sales challans
- `POST /api/challans` - Generate sales challan (Draft or Confirmed)
- `PATCH /api/challans/:id/status` - Confirm or cancel challan

---

## 🌐 Deployment Instructions (Free Hosting Options)

### Frontend (Vercel / Render Static Site / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment variables: Set API endpoint if hosted separately.

### Backend (Render / Railway / Fly.io)
1. Root directory: `backend`
2. Build command: `npm run build && npx prisma db push`
3. Start command: `npm run start`

---

## ⭐ Bonus Features Implemented

- ✅ **PDF Invoice Export & Print**: HTML2Canvas & jsPDF invoice export for sales challans.
- ✅ **Complete Stock Movement Audit Log**: Historical log of all inventory additions and subtractions.
- ✅ **1-Click Role Switcher**: Quick test role login shortcuts on the authentication screen.
- ✅ **Low Stock Alert Dashboard Banner**: Instant visibility into items requiring replenishment.

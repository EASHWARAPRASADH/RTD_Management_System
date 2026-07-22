# 🥤 RTD Distro v2.4 — Beverage Distribution, Billing & Stock Management System

A high-performance Enterprise Web Application designed specifically for **Ready-To-Drink (RTD) Beverage Wholesale Distributors**, CPG Suppliers, and Logistics Operations.

It streamines route-based selling, customer ledger tracking, automated GST invoicing, full case vs. loose unit inventory control, payment collections, and Excel data bulk migration.

---

## 🌟 Key Features

### ⚡ 1. Point of Sale & Invoice Generation (Billing)
- **Full Case & Loose Unit Support**: Automatically calculates case packaging ratios (e.g. 24 cans/case or 12 bottles/case) alongside loose unit pricing.
- **Dynamic GST & Tax Engine**: Automated HSN/SAC code tracking, customizable GST percentage rates, automatic tax split calculations, and optional bill round-off.
- **Live UPI & QR Payments**: Displays real-time UPI QR codes directly on invoices for instant customer payments via Google Pay, PhonePe, Paytm, etc.
- **Thermal & A4 Print Engine**: Built-in support for thermal receipt printers (80mm) and formal A4 PDF invoice downloads powered by `jsPDF` & `jspdf-autotable`.

### 📦 2. Real-time Inventory & Stock Tracking
- **Stock Depletion on Bill Creation**: Creating a sales invoice automatically deducts stock in real-time.
- **Low Stock Threshold Alerts**: Visual indicators and dashboard alerts when stock drops below safety thresholds.
- **Batch & Expiry Management**: Track manufacturing dates, expiry alerts, shelf life, and HSN codes across RTD segments (Energy Drinks, Cold Brews, Flavored Milk, Sparkling Sodas, Isotonic Sports Drinks, etc.).

### 🚚 3. Route & Customer Management
- **Territory / Route Partitioning**: Organize retail outlets and supermarkets into designated delivery routes (e.g. *Route 01 - Central District*, *Route 02 - East Expressway*).
- **Customer Outlets Ledger**: Track pending dues, credit limits, GSTIN details, contact persons, and location addresses per shop outlet.
- **Credit Limit Checks**: Real-time warnings when customer pending dues exceed allocated credit limits.

### 💰 4. Payment Collections & Aging Analysis
- **Partial & Full Collections**: Log payment receipts via Cash, UPI, Bank Transfer, or Cheque against open invoices.
- **Payment Aging Tracking**: Categorize outstanding dues by age (0-15 days, 16-30 days, 31-60 days, 60+ days) with automated status updates (`PAID`, `PARTIAL`, `PENDING`).

### 📊 5. Dynamic Analytics & Financial Reports
- **Real-Time Revenue Metrics**: Track daily sales turnover, total collections, total outstanding dues, and active shop counts.
- **Segment Breakdown**: Interactive Recharts pie charts displaying market share across RTD beverage categories.
- **Route Performance**: Bar chart visualizations comparing revenue performance across delivery territories.

### 📊 6. Excel Data Hub
- **Bulk Import**: Seamlessly import customers, products, and historic invoices using `.xlsx` or `.csv` files.
- **Bulk Export**: One-click download of customer master lists, product catalogs, ledger statements, and audit logs.
- **Template Generators**: Pre-formatted Excel sample templates for effortless onboarding.

### 🔒 7. Cloud Real-Time Database & Audit Security
- **Firebase Firestore Integration**: Dual-engine sync with local storage fallback and real-time multi-device cloud synchronization.
- **Production Clean State Mode**: One-click wipe tool in Settings to switch from demo sample data to a clean 0-state live production database.
- **Audit Logs**: Comprehensive event trail recording bill creation, payment entries, stock updates, and admin settings changes.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Styling & Design** | Tailwind CSS v4 + Lucide React Icons |
| **State & Motion** | React State + Motion (Framer Motion) |
| **Backend & Dev Server**| Express.js + Node.js (Bundled via `esbuild`) |
| **Build Tooling** | Vite 6 + TSX |
| **Database & Sync** | Google Cloud Firestore (Firebase v12) + LocalStorage Sync |
| **PDF & Printing** | jsPDF + jsPDF-AutoTable + QRCode Generator |
| **Data Viz** | Recharts v3 |
| **Spreadsheets** | SheetJS (`xlsx`) |

---

## 📁 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── AuditLog/        # Security audit log table & filtering
│   │   ├── Billing/         # Billing & POS module, Invoice Modal, Printing
│   │   ├── Customers/       # Customer outlets directory & ledger
│   │   ├── Dashboard/       # Sales trends, route charts & overview metrics
│   │   ├── ExcelHub/        # Excel import/export suite & log viewer
│   │   ├── Inventory/       # Low stock alerts & stock replenishment
│   │   ├── Payments/        # Collection entry & payment history
│   │   ├── Products/        # Product catalog management
│   │   ├── Reports/         # Analytics, GST reports, route reports
│   │   ├── Settings/        # Shop branding, UPI setup, Production wipe mode
│   │   ├── GlobalSearchModal.tsx # Universal search modal (Ctrl+K)
│   │   ├── Navbar.tsx       # Top bar navigation & search trigger
│   │   └── Sidebar.tsx      # Main navigation menu
│   ├── data/
│   │   └── mockData.ts      # Sample data seeds for demo mode
│   ├── services/
│   │   ├── db.ts            # Local database service & state engine
│   │   ├── firebaseDb.ts    # Firebase Firestore real-time sync service
│   │   ├── firebase.ts      # Firebase initialization & config
│   │   └── pdfService.ts    # PDF invoice generation & print layout
│   ├── types.ts             # TypeScript interfaces & types
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # Main client entry point
│   └── index.css            # Tailwind CSS styling setup
├── server.ts                # Express backend & Vite middleware server
├── metadata.json            # Application metadata configuration
├── package.json             # Dependencies & scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/rtd-distro.git
   cd rtd-distro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional for cloud sync):
   Create a `.env` file in the root directory (or use `.env.example` as reference):
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 💡 Usage & Workflow Examples

### Creating a Sales Bill (POS)
1. Go to **Billing & POS** from the sidebar or click **Create New Bill**.
2. Select the target Customer Outlet (e.g. *Metro Supermarket*). Route and GST details load automatically.
3. Select RTD beverage items from the stock catalog. Choose **Full Case** or **Loose Can**.
4. Adjust quantity and optional line discounts. Tax and grand total update dynamically.
5. Click **SAVE & PRINT BILL** to generate the PDF receipt, deduct stock, and sync in real time.

### Managing Production vs. Demo Data
- **Demo Mode**: Includes sample products (Energy Drinks, Cold Brews), test distributors, and invoices.
- **Clean Production Mode**:
  1. Navigate to **Shop Settings** -> **Production & Data Mode**.
  2. Click **Clear All Demo Data (Start Production Fresh)**.
  3. The app wipes all sample data from LocalStorage and Cloud Firestore so you can begin live operations from `0`.
  4. You can restore sample data at any time via **Restore Sample Demo Dataset**.

---

## 📜 License & Acknowledgments

Built for high-volume Ready-To-Drink (RTD) beverage distribution businesses. Powered by Google AI Studio, React, Tailwind CSS, and Firebase Firestore.

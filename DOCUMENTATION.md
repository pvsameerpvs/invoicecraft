# InvoiceCraft - Complete Documentation

## 1. Project Overview
**InvoiceCraft** is a modern, feature-rich invoice management application built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. It uses **Google Sheets** as a serverless database, making it a zero-cost, highly accessible solution for small businesses and freelancers.

### Key Features
*   **dashboard**: Real-time financial analytics, revenue charts, and status tracking (Paid/Unpaid/Overdue).
*   **Invoice Generation**: Create professional A4 invoices with customizable line items.
*   **PDF Export**: Client-side high-quality PDF generation using `html2pdf.js`.
*   **Role-Based Authentication**: Secure login system with Admin and User roles.
    *   **Admins**: Full access to all data and user management.
    *   **Users**: Access only to their own invoices.
*   **Google Sheets Sync**: All data (Users, Invoices, Settings) is persisted in Google Sheets.
*   **Customizable Settings**: Manage company details, banking info, and UI themes (Orange, Blue, Green, etc.).
*   **Invoice History**: specific filtering, searching, and status management.

---

## 2. Technical Architecture

### Tech Stack
*   **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: Shadcn UI primitives, Lucide React (Icons).
*   **Charts**: [Recharts](https://recharts.org/) for dashboard analytics.
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand).
*   **Database**: Google Sheets (via `googleapis`).
*   **PDF Engine**: `html2pdf.js`.

### Project Structure
```
├── app/
│   ├── api/            # Server-side API Routes (Auth, Invoices, Stats)
│   ├── dashboard/      # Dashboard page with analytics
│   ├── invoice/        # Invoice creation/editor
│   ├── history/        # Invoice history list
│   ├── profile/        # Settings & User Management
│   └── lib/            # Shared utilities (Auth, Sheets, Themes)
├── components/         # Reusable UI components
├── lib/
│   ├── googleSheets.ts # Google Sheets connection helper
│   └── auth.ts         # User verification logic
├── public/             # Static assets
└── middleware.ts       # Route protection & Auth checks
```

---

## 3. Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   A Google Cloud Project with **Google Sheets API** enabled.
*   A Service Account with minimal permissions.

### Step 1: Clone & Install
```bash
git clone <repository-url>
cd invoicecraft
npm install
```

### Step 2: Google Cloud Setup
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project.
3.  Enable **Google Sheets API**.
4.  Create a **Service Account**.
5.  Create a JSON Key for the service account and download it.
6.  **Important**: Share your Google Sheet with the Service Account email address (Editor access).

### Step 3: Google Sheet Structure
Create a new Google Sheet and create the following tabs (sheets) with the specified columns (Row 1 is headers).

#### Tab 1: `Users`
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| ID | Username | Password | Role | Email | Mobile | CreatedAt |
*   *Note*: Passwords should be hashed if using the production hashing logic, or plain text if developing (check `auth.ts`).

#### Tab 2: `Invoices`
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CreatedAt | InvoiceNumber | Date | InvoiceToCompany | Subject | Currency | Subtotal | Vat | Total | PayloadJson | CreatedBy | Status |

#### Tab 3: `LineItems`
| A | B | C | D |
|---|---|---|---|
| InvoiceNumber | Id | Description | Amount |

#### Tab 4: `Settings`
| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CompanyName | CompanyAddress | BankCompanyName | BankName | BankLabel | AccountNumber | AccountIban | FooterNote | SignatureLabel | Currency | CompanyTrn | Theme | LogoUrl |

### Step 4: Environment Variables
Create a `.env.local` file in the root directory:

```env
# Google Sheets ID (found in the URL of your sheet)
GOOGLE_SHEET_ID=1oo7G79VtN-zIQzlpKzVHGKGDObWik7MUPdVA2ZrEayQ

# Service Account Credentials
# Option 1: Base64 Encoded JSON (Recommended)
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=<Base64_Encoded_String_of_JSON_File>

# Option 2: Individual Fields (Legacy support)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

**How to generate Base64:**
```bash
cat service-account.json | base64
```
Copy the output into `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`.

### Step 5: Run Locally
```bash
npm run dev
```
Access the app at `http://localhost:3000`.

---

## 4. Features & Usage Guide

### Authentication
*   **Login**: `/api/login` verifies credentials against the `Users` sheet.
*   **Session**: Uses HTTP-only cookies (`invoicecraft_auth`, `invoicecraft_role`).
*   **Middleware**: Automatically redirects unauthenticated users to the login page.

### Dashboard
*   **Overview**: Visualizes total revenue, tax collected, and unpaid invoices.
*   **Filters**: Toggle between Monthly, Yearly, or All-time views.
*   **Charts**: Area charts for revenue trends and Pie charts for status distribution.
*   **Logic**: Data is fetched via `/api/dashboard-stats`, which aggregates data from the `Invoices` sheet.

### Invoice Management
*   **Create**: Go to `/invoice`. Fill in line items. Click "Download PDF".
*   **Save**: Invoices are automatically saved to the `Invoices` sheet upon creation/download.
*   **History**: `/history` shows a table of all invoices.
    *   **Edit**: Click an invoice to edit its details.
    *   **Delete**: Admins can delete any invoice; Users can only delete their own.
*   **Status**: Toggle status between `Paid`, `Unpaid`, `Overdue`.

### Profile & Settings
*   **Company Details**: Saved in `Settings` sheet (Row 2). Shared across all invoices.
*   **Bank Info**: Configure Bank Name, IBAN, Account # for the invoice footer.
*   **Themes**: Change the accent color (Orange, Blue, Green, Violet) which applies globally to the UI and generated PDFs.
*   **User Management** (Admin Only): Create new users directly from the UI.

---

## 5. API Reference

### Auth
*   `POST /api/login`: Authenticate user.
*   `GET /api/logout`: Clear cookies.

### Invoices
*   `GET /api/invoice-history`: List invoices (supports query params: `search`, `status`, `date`).
*   `POST /api/invoice-history`: Create a new invoice.
*   `PUT /api/invoice-history`: Update an existing invoice.
*   `DELETE /api/invoice-history`: Delete an invoice.

### Dashboard
*   `GET /api/dashboard-stats`: Get aggregated statistics.

### Settings
*   `GET /api/settings`: Retrieve app configuration.
*   `POST /api/settings`: Update app configuration.

---

## 6. Deployment
The application is designed to be deployed on **Vercel** or any Node.js compatible host.

1.  Push code to GitHub.
2.  Import project to Vercel.
3.  Add the Environment Variables (from Step 4) to Vercel Project Settings.
4.  Deploy.

**Note**: Since this uses Google Sheets API, ensure the Service Account key does not have line-break formatting issues when adding to Vercel environment variables. Using the Base64 encoded variable (`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`) is the safest method.

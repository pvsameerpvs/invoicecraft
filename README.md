# JS InvoiceCraft

A small Next.js (App Router) project that provides an editable invoice form and a live A4 invoice preview.  
The preview can be exported as a high-quality PDF that closely matches the provided example invoice.

## Features

- Next.js 14 App Router
- Tailwind CSS styling
- Simple shadcn/ui-style primitives (`Button`, `Input`, `Textarea`, `Label`)
- Two-column layout on `/invoice`
  - Left: form with all invoice fields
  - Right: A4-style invoice preview
- Upload a custom logo image (shown at top of preview)
- Editable:
  - Company details
  - Billing details
  - Invoice number & date
  - Subject
  - Dynamic line items (add / remove)
  - Currency label
  - Optional total override
  - Bank / payment details
  - Signature line & footer note
- Client-side PDF generation using `html2pdf.js` with A4 page size
- Minimal Jest + React Testing Library test verifying that clicking **Download PDF** calls the PDF generator.

## Getting started

### 1. Install dependencies

```bash
npm install
# or
yarn
# or
pnpm install
```

### 2. Run the dev server

```bash
npm run dev
```

Open your browser at `http://localhost:3000` and click **Open Invoice Editor**.

### 3. Build for production

```bash
npm run build
npm start
```

### 4. Run tests

```bash
npm test
```

## Usage notes

- Navigate to `/invoice`.
- Use the form on the left to edit all invoice fields.
- Upload a logo (PNG/JPEG) to replace the placeholder text.
- Add or remove line items as needed.
- The **Total** at the bottom of the preview:
  - If the **Override total** field is filled, that value is used.
  - Otherwise, it's calculated from the line item amounts.
- When you click **Download PDF**, the right-hand preview is rendered to a
  portrait A4 PDF via `html2pdf.js`, then automatically downloaded by the browser.

The preview uses fixed A4-like pixel dimensions (`794x1123`) on large screens to keep
the PDF output predictable and print-ready.

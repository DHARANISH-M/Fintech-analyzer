# Agentica Bank Statement Analyzer

A fintech-style web app for uploading bank statement PDFs, extracting transactions, analyzing spending patterns, and exporting structured spreadsheet data.

## Project Structure

```text
backend/
  netlify/
  server/
  shared/
frontend/
  client/
  public/
  index.html
README.md
Deliverables.md
ProblemStatement.md
AGENTS.md
package.json
tsconfig.json
netlify.toml
vercel.json
```

## Frontend

The `frontend/` folder contains the React + Tailwind CSS application.

Important areas:
- `frontend/client/pages/app/` for authenticated dashboard pages
- `frontend/client/pages/public/` for landing, login, signup, and onboarding flows
- `frontend/client/components/` for reusable UI and chart sections
- `frontend/client/lib/finance-api.ts` for API access helpers

## Backend

The `backend/` folder contains the Express server, Textract pipeline, SQL integration, and S3 document handling.

Important areas:
- `backend/server/routes/` for REST endpoints
- `backend/server/db.ts` for database setup and schema management
- `backend/server/statement.ts` for analytics and aggregation logic
- `backend/server/textract.ts` for PDF extraction handling
- `backend/shared/api.ts` for shared frontend-backend types

## Core Features

- PDF statement upload and extraction
- Structured transaction storage in MySQL
- Dashboard and analytics insights
- Excel spreadsheet export for extracted data
- Document management, including delete support

## Run Locally

```bash
npm install
npm run dev
```

For TypeScript validation:

```bash
npm run typecheck
```

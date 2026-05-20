# Meter Unassign Tool

A Next.js app to unassign a meter from a household in your PostgreSQL database.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your database

Edit `.env.local` and set your database URL:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
```

> If your DB requires SSL (e.g. Supabase, Railway, Neon), the app handles it automatically.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What it does

When you submit the form with a **HHID** and **Meter ID**, the app:

1. Looks up the household UUID from `households` where `hhid = ?`
2. Looks up the meter UUID from `meters` where `meter_id = ?`
3. Deletes the row from `meter_assignments` matching both IDs
4. Updates the `meters` table: sets `assigned_household_id = NULL`, `is_assigned = FALSE`, `updated_at = NOW()`
5. Returns the updated meter record for verification

## Build for production

```bash
npm run build
npm start
```

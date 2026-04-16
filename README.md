# Little Shop — Luxury Boutique E-commerce

A high-end luxury boutique e-commerce platform built with React, Tailwind CSS, Framer Motion, and Supabase.

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, Lucide Icons, Zustand
- **Backend:** Supabase (Auth, Database, Storage)
- **Payments:** Razorpay
- **Fonts:** Playfair Display (Titles) + Inter (Body)

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

## Supabase Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create all tables, RLS policies, and triggers.

## Project Structure

```
src/
├── components/
│   ├── home/          # Landing page sections
│   └── layout/        # Header, Footer, MobileNav, Layout
├── lib/               # Supabase client, constants
├── pages/             # Route pages
│   └── admin/         # Admin dashboard
└── store/             # Zustand state management
```

## Business Rules

- **Shipping:** Free on orders > ₹1,500; ₹100 otherwise
- **Payment:** Online only (Razorpay) — No COD
- **Returns:** No returns / No exchanges
- **Orders:** Saved to DB only after verified payment

## Admin Dashboard

Access at `/admin`. Manage products, orders, inventory, abandoned carts, flash sales, and live sales pop-ups.

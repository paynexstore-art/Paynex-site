# PayNex — Smart Installment Platform

التقسيط الذكي في مصر | Smart Installment Solutions

## 🎯 Overview

PayNex is an intelligent installment financing platform built with **Next.js 14 (App Router) + TypeScript + Prisma + Supabase**. It provides users with seamless product browsing, order management, installment tracking, supervisor tools, and a comprehensive admin dashboard across Egypt.

## 🚀 Features

- **Product Catalog**: Browse products across categories with installment calculator
- **User & Supervisor Authentication**: Secure login, RBAC (roles: super_admin, admin, supervisor, customer)
- **Order Management**: Full lifecycle (inquiry, approval, delivery, payments)
- **Supervisor Dashboard**: Attendance, wallet sync, orders, check-in/out with location verification
- **Admin Dashboard**: Advanced management for products, orders, supervisors, analytics, financials, SEO, marketing, audit logs
- **Multi-language Support**: Arabic and English interface
- **Mobile Responsive & PWA**: Works on all devices with offline capabilities
- **Security**: Supabase RLS, AES encryption, middleware auth, security headers

## 📋 Project Structure

```
src/
├── app/                    # Next.js App Router (pages & layouts)
│   ├── (admin)/secure-dashboard/...
│   ├── (customer)/...
│   ├── (supervisor)/...
│   ├── api/                # API routes
│   └── ...
├── components/             # Reusable UI (Radix, shadcn, custom)
├── lib/                    # Business logic, Supabase clients, Prisma, auth, RBAC
├── contexts/               # React contexts
├── hooks/                  # Custom hooks
├── store/                  # Zustand stores
├── types/                  # TypeScript definitions
└── assets/                 # Static assets
public/                     # Static files, PWA service worker
prisma/                     # Prisma schema & migrations
supabase/                   # Migrations & config
```

## 🔐 Security & Compliance

- **Authentication & RBAC**: Middleware-protected routes + role checks
- **Data Protection**: Supabase Row Level Security (RLS), AES-256 encryption for sensitive data
- **API Security**: Environment variables, service role keys server-side only
- **Input Validation**: Zod + react-hook-form
- **Headers**: X-Frame-Options, HSTS, CSP-ready, Referrer-Policy (via vercel.json)
- **Audit Logging**: Comprehensive action tracking

## 📦 Installation & Development

### Requirements

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/paynexstore-art/Paynex-site.git
cd Paynex-site
npm install
```

### Environment Variables

Copy `.env.example` → `.env.local` and fill with real Supabase + database credentials (see Vercel section).

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:3000`

### Production Build

```bash
npm run build   # Runs prisma generate + next build
npm run start
```

### Linting

```bash
npm run lint
```

## 📊 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode enabled)
- **Styling**: Tailwind CSS 3 + Radix UI + shadcn/ui
- **Database**: PostgreSQL (via Supabase) + Prisma ORM
- **Auth**: Supabase Auth + custom RBAC
- **Build Tool**: Next.js + next-pwa
- **Package Manager**: npm
- **Deployment**: Vercel (with security headers)

## 🌐 Deployment (Vercel Recommended)

1. Push to GitHub `main`
2. Connect repo to Vercel
3. Add these **Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL` (Prisma/Postgres)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AES_SECRET_KEY`
   - Any others (Google OAuth, WhatsApp API, etc.)
4. Deploy automatically on push. Build command: `prisma generate && next build`

**Important**: `vercel.json` includes security headers and framework setting.

### Other Platforms

Use `npm run build` and serve the `.next` output (Vercel is strongly recommended for Next.js + Prisma).

## 📝 Development Guidelines

- Use App Router for new pages (`src/app/`)
- Server components by default; client with `"use client"`
- Prisma for DB access (via `src/lib/prisma.ts`)
- Inline Supabase clients (no shared legacy clients)
- Always validate inputs with Zod
- Update audit logs for admin actions
- Test RBAC on protected routes

## 🤝 Contributing

1. Create a feature branch
2. Make changes + test build (`npm run build`)
3. Update relevant docs
4. Submit pull request

## 📄 License

All rights reserved © 2026 PayNex

## 📞 Support

Open an issue on GitHub.

---

**Last Updated**: 2026-06-09  
**Current Version**: 1.3.0 (Next.js migration complete)  
**Status**: Production-ready on Vercel + Supabase

**Recent Improvements**:
- Full migration to Next.js 14 App Router
- Legacy Vite files cleaned
- Security headers added
- Prisma + Supabase integration hardened
- Build verified on Vercel

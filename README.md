# AgroLink Backend

AgroLink backend is a role-based REST API for an agriculture marketplace. It handles authentication, listing and bid workflows, order lifecycle, wallet transactions, admin operations, and payment integration.

## Live Links

- Backend Live URL: `Add your deployed backend URL`
- Frontend Live URL: `Add your deployed frontend URL`

## Features

- Better Auth based authentication and session handling
- Role-based access control (ADMIN, FARMER, BUYER)
- Listing management (create, read, update, soft delete)
- Bid management (place, accept, reject)
- Order lifecycle and payment status flow
- Stripe integration for payment processing
- Wallet transaction tracking
- Review system for order participants
- Validation with Zod
- Centralized error handling with consistent API error responses

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Better Auth
- Stripe
- Zod

## Project Structure

```text
src/
  app/
    config/            # Environment config
    middlewares/       # Auth, error, not-found, etc.
    modules/           # Feature modules (auth, listing, bids, orders, admin...)
    lib/               # Prisma/auth/stripe/mail utilities
  app.ts               # Express app configuration
  server.ts            # App bootstrap
prisma/
  schema.prisma
  migrations/
```

## Environment Variables

Create a `.env` file in the backend root:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:5000

EMAIL_SENDER_SMTP_USER=your_smtp_user
EMAIL_SENDER_SMTP_PASS=your_smtp_password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=AgroLink <no-reply@agrolink.com>

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google

FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=your_stripe_secret_key

SUPER_ADMIN_EMAIL=admin@agrolink.com
SUPER_ADMIN_PASSWORD=your_admin_password
```

## Getting Started

```bash
npm install
npm run generate
npm run migrate
npm run dev
```

Server runs on `http://localhost:5000` (based on `PORT`).

## Available Scripts

- `npm run dev` - Start backend in watch mode
- `npm run build` - Build project and generate Prisma client
- `npm run start` - Start server with tsx
- `npm run migrate` - Run Prisma migrate dev
- `npm run generate` - Generate Prisma client
- `npm run db:seed` - Seed database
- `npm run studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix lint issues
- `npm run format` - Format code with Prettier

## API Base

- Local base URL: `http://localhost:5000/api`

Core route groups:

- `/api/auth`
- `/api/users`
- `/api/listings`
- `/api/bids` (mounted through `/api`)
- `/api/orders`
- `/api/wallet`
- `/api/admin`

## Deployment

- Recommended: Vercel or Render
- This repository includes Vercel configuration (`vercel.json`)
- Make sure all environment variables are configured in deployment settings
- Use a production PostgreSQL database and run migrations before go-live

## Author

- Name: `Tareq Ferdous`
- Email: `tareqferdous10@gmail.com`

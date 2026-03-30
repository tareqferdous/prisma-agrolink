# 🌾 AgroLink — Backend

> Express.js REST API for AgroLink — an agricultural marketplace that connects Bangladeshi farmers with buyers through competitive bidding, Stripe-secured payments, and email notifications.

---

## 🔗 Live Links

|                    | URL                                         |
| ------------------ | ------------------------------------------- |
| **Backend Live**   | `https://agrolink-backend-neon.vercel.app`  |
| **Frontend Live**  | `https://agrolink-frontend-silk.vercel.app` |
| **Admin Email**    | `tareqferdous10@gmail.com`                  |
| **Admin Password** | `admin123456`                               |

---

## 🔄 API Flow

### Bid Acceptance — Atomic Transaction

```
POST /api/listings/:id/bids       ← Buyer places bid
PATCH /api/bids/:id/accept        ← Farmer accepts
        │
        └── prisma.$transaction [
              1. bid → ACCEPTED
              2. other bids → REJECTED
              3. listing → CLOSED
              4. order → CREATED
              5. emails → SENT
            ]
```

### Payment Flow

```
POST /api/orders/:id/pay          ← Create Stripe PaymentIntent
        │
        └── Stripe returns clientSecret
        │
Frontend completes payment (Stripe Elements)
        │
PATCH /api/orders/:id/confirm-payment   ← Verify payment success
PATCH /api/orders/:id/ship              ← Farmer ships
PATCH /api/orders/:id/confirm-received  ← Buyer confirms
        │
        └── prisma.$transaction [
              1. order → COMPLETED
              2. wallet += farmerAmount
              3. WalletTransaction record created
            ]
```

### Role & Verification Guard

```
Request
  │
  ├── requireAuth("FARMER")     ← checks Better Auth session + role
  │
  ├── requireVerified           ← checks isVerified === true
  │
  └── Controller / Service
```

---

## ✨ Features

- REST API with modular feature-based architecture
- Better Auth — session-based authentication
- Role-based access control — FARMER, BUYER, ADMIN
- Admin verification guard — unverified users blocked from key actions
- Prisma ORM with PostgreSQL (Neon DB)
- Stripe PaymentIntent — escrow payment flow
- Nodemailer + Gmail SMTP — 6 email notification types
- Zod request validation on all endpoints
- Global error handler — Prisma + Zod errors normalized
- Soft delete for listings
- Dynamic filter meta — locations, categories, price range in one API call

---

## 📡 API Endpoints

### Auth

```
GET     /api/auth/me                        Get current session user
```

### Users

```
GET     /api/users/profile                  Get own profile
PATCH   /api/users/profile                  Update own profile
GET     /api/users/:id/profile              Get public user profile
GET     /api/users/:id/reviews              Get user reviews
```

### Listings

```
GET     /api/listings                       Get all listings (+ filterMeta)
GET     /api/listings/my                    Get farmer's own listings
GET     /api/listings/:id                   Get listing by ID
POST    /api/listings                       Create listing [FARMER + verified]
PATCH   /api/listings/:id                   Update listing [FARMER + verified]
DELETE  /api/listings/:id                   Delete listing [FARMER]
```

### Bids

```
POST    /api/listings/:id/bids              Place bid [BUYER + verified]
GET     /api/listings/:id/bids              Get bids for listing [FARMER]
GET     /api/bids/my                        Get own bids [BUYER]
PATCH   /api/bids/:id/accept                Accept bid [FARMER]
```

### Orders

```
GET     /api/orders/my                      Get own orders
GET     /api/orders/:id                     Get order by ID
POST    /api/orders/:id/pay                 Create Stripe PaymentIntent
PATCH   /api/orders/:id/confirm-payment     Confirm Stripe payment
PATCH   /api/orders/:id/ready-pickup        Mark ready for pickup [FARMER]
PATCH   /api/orders/:id/ship                Ship order [FARMER]
PATCH   /api/orders/:id/confirm-received    Confirm received [BUYER]
```

### Wallet

```
GET     /api/wallet                         Get wallet balance + transactions
```

### Reviews

```
POST    /api/orders/:id/review              Submit review after completion
```

### Admin

```
GET     /api/admin/users                    Get all users
GET     /api/admin/users/:id                Get user by ID
PATCH   /api/admin/users/:id                Update user (verify, ban)
GET     /api/admin/listings                 Get pending listings
PATCH   /api/admin/listings/:id/approve     Approve listing
PATCH   /api/admin/listings/:id/reject      Reject listing with reason
GET     /api/admin/orders                   Get all orders
GET     /api/admin/analytics                Get platform analytics
```

---

## 🗄️ Database Schema

```
User
  ├── id, name, email, role (FARMER/BUYER/ADMIN)
  ├── phone, location, companyName, image
  ├── isVerified, isBanned, walletBalance
  └── sessions, accounts (Better Auth)

Listing
  ├── id, cropName, category, quantity, unit
  ├── minPricePerUnit, description, harvestDate
  ├── location, deliveryOptions, images
  ├── status (PENDING_APPROVAL/ACTIVE/CLOSED/REJECTED)
  ├── isDeleted, deletedAt (soft delete)
  └── farmerId → User

Bid
  ├── id, bidAmount, buyerNote
  ├── bidStatus (PENDING/ACCEPTED/REJECTED)
  ├── listingId → Listing
  └── buyerId → User

Order
  ├── id, cropPrice, farmerAmount, platformFee
  ├── deliveryMethod, courierName, trackingNumber
  ├── orderStatus (PENDING_PAYMENT/PAID/SHIPPED/COMPLETED)
  ├── paymentStatus, stripePaymentIntentId
  ├── listingId → Listing
  ├── farmerId → User
  └── buyerId → User

WalletTransaction
  ├── id, amount, type
  ├── userId → User
  └── orderId → Order

Review
  ├── id, rating, comment
  ├── reviewerId → User
  ├── revieweeId → User
  └── orderId → Order
```

**Enums:**

```
Role:        FARMER | BUYER | ADMIN
Category:    VEGETABLES | FRUITS | GRAINS | RICE | PULSES | SPICES | DAIRY | OTHERS
Unit:        KG | MON | TON
DeliveryOption: PICKUP | COURIER
ListingStatus:  PENDING_APPROVAL | ACTIVE | CLOSED | REJECTED
BidStatus:   PENDING | ACCEPTED | REJECTED
OrderStatus: PENDING_PAYMENT | PAID | READY_FOR_PICKUP | SHIPPED | COMPLETED | CANCELLED
```

---

## 🛠️ Tech Stack

| Tech                    | Use                                |
| ----------------------- | ---------------------------------- |
| Express.js + TypeScript | REST API framework                 |
| Prisma ORM              | Database queries and migrations    |
| PostgreSQL (Neon DB)    | Serverless database                |
| Better Auth             | Session-based authentication       |
| Stripe                  | Payment processing (PaymentIntent) |
| Nodemailer + Gmail SMTP | Transactional emails               |
| Zod                     | Request validation                 |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── config/
│   │   └── env.ts              # Zod-validated environment variables
│   ├── lib/
│   │   ├── auth.ts             # Better Auth config
│   │   ├── prisma.ts           # PrismaClient singleton
│   │   ├── stripe.ts           # Stripe client
│   │   └── mailer.ts           # Nodemailer — 6 email templates
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # requireAuth, requireVerified
│   │   ├── globalErrorHandler.ts
│   │   └── validateRequest.ts
│   ├── modules/
│   │   ├── auth/               # GET /api/auth/me
│   │   ├── listing/            # Full CRUD + filterMeta
│   │   ├── bids/               # Place, view, accept
│   │   ├── orders/             # Stripe flow + delivery
│   │   ├── wallet/             # Balance + history
│   │   ├── reviews/            # Two-way rating
│   │   ├── users/              # Profile management
│   │   └── admin/              # Admin-only operations
│   ├── errorHelpers/
│   │   ├── AppError.ts
│   │   ├── handlePrismaErrors.ts
│   │   └── handleZodError.ts
│   └── shared/
│       ├── catchAsync.ts
│       └── sendResponse.ts
├── app.ts                      # Express app + Better Auth routes
└── server.ts                   # Bootstrap + signal handlers
```

---

## ⚙️ Environment Variables

Create `.env` in the backend root:

```env
DATABASE_URL=your_neon_postgresql_url

BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:5000

FRONTEND_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_your_stripe_key

IMAGEBB_API_KEY=your_imagebb_key

EMAIL_SENDER_SMTP_USER=your@gmail.com
EMAIL_SENDER_SMTP_PASS=your_gmail_app_password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=your@gmail.com

PLATFORM_FEE_PERCENT=3
PORT=5000
NODE_ENV=development
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed admin account
npm run db:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

---

## 📜 Available Scripts

```bash
npm run dev          # Start with tsx watch mode
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled dist/server.js
npm run db:seed      # Seed admin@agrolink.com / admin123456
```

---

## 📧 Email Notifications

| Event            | Recipient |
| ---------------- | --------- |
| New bid received | Farmer    |
| Bid accepted     | Buyer     |
| Bid rejected     | Buyer     |
| Listing approved | Farmer    |
| Listing rejected | Farmer    |
| Order shipped    | Buyer     |
| Order completed  | Both      |

---

## 🚢 Deployment

Recommended: **Vercel**

1. Push code to GitHub
2. Import repo in Vercel — set Root Directory to `backend`
3. Framework Preset: `Other`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add all environment variables in Vercel dashboard
7. After deploy, run migrations:

```bash
DATABASE_URL="your_neon_url" npx prisma migrate deploy
```

**`vercel.json`:**

```json
{
  "version": 2,
  "builds": [{ "src": "src/app.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/app.ts" }]
}
```

---

## 🧪 Test Accounts

| Role  | Email                    | Password    |
| ----- | ------------------------ | ----------- |
| Admin | tareqferdous10@gmail.com | admin123456 |

**Stripe Test Card:** `4242 4242 4242 4242` · Exp: `12/29` · CVC: `123`

---

## 👤 Author

- **Name:** Tareq Ferdous
- **Email:** tareqferdous10@gmail.com
- **GitHub:** [github.com/your-username](https://github.com/tareqferdous)


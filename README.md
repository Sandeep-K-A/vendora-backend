# Vendora Backend

REST API for Vendora — a multi-seller e-commerce platform where sellers can create stores, list products, and manage orders. Buyers can browse stores, search products with AI-powered semantic search, and checkout securely.

---

## Tech Stack

- **Runtime** — Node.js
- **Language** — TypeScript
- **Framework** — Express
- **Database** — PostgreSQL
- **ORM** — Prisma
- **Validation** — Zod
- **Authentication** — JWT
- **Payments** — Stripe
- **AI** — OpenAI
- **Logging** — Pino

---

## Features

- Role-based authentication — Buyer, Seller, Admin
- Seller store and product management
- AI-powered semantic search with pgvector
- AI description and SEO title generator for sellers
- Cart and checkout with Stripe
- Commission tracking per order
- Seller AI subscription with Stripe billing
- Admin dashboard and store management

---

## Project Structure

```
src/
├── middlewares/
│   ├── errorHandler.ts
│   └── notFound.ts
├── routes/
│   └── index.ts
├── lib/
│   ├── prisma.ts
│   ├── env.ts
│   └── logger.ts
├── types/
│   └── express.d.ts
├── server.ts
└── index.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vendora-backend.git
cd vendora-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default 3000) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiry duration |
| `CLIENT_URL` | Frontend URL for CORS |

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| GET | `/api/v1/auth/me` | Get current user | Private |

### Stores
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/stores` | Create store | Seller |
| GET | `/api/v1/stores` | Get all stores | Public |
| GET | `/api/v1/stores/:slug` | Get store by slug | Public |
| PATCH | `/api/v1/stores/:slug` | Update store | Seller |

### Products
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/v1/products` | Create product | Seller |
| GET | `/api/v1/products` | Get all products | Public |
| GET | `/api/v1/products/:id` | Get product | Public |
| PATCH | `/api/v1/products/:id` | Update product | Seller |
| DELETE | `/api/v1/products/:id` | Delete product | Seller |

> Full API documentation coming soon.

---

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm start            # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

---

## License

MIT

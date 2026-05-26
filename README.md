# Vendora Backend

REST API for Vendora — a multi-seller e-commerce platform where sellers can create stores, list products, and manage orders. Buyers can browse stores, search products with AI-powered semantic search, and checkout securely.

---

## Status

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🚧 | In Progress |
| 📋 | Planned |

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

| Feature | Status |
|---|---|
| Role-based authentication — Buyer, Seller, Admin | 📋 Planned |
| Seller store and product management | 📋 Planned |
| AI-powered semantic search with pgvector | 📋 Planned |
| AI description and SEO title generator for sellers | 📋 Planned |
| Cart and checkout with Stripe | 📋 Planned |
| Commission tracking per order | 📋 Planned |
| Seller AI subscription with Stripe billing | 📋 Planned |
| Admin dashboard and store management | 📋 Planned |

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

| Variable | Description | Status |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NODE_ENV` | `development` or `production` | ✅ |
| `PORT` | Server port (default 3000) | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | 📋 Planned |
| `JWT_EXPIRES_IN` | JWT expiry duration | 📋 Planned |
| `CLIENT_URL` | Frontend URL for CORS | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | 📋 Planned |
| `OPENAI_API_KEY` | OpenAI API key | 📋 Planned |

---

## API Endpoints

Full API documentation will be updated as features are completed.

### Auth
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register new user | 📋 Planned |
| POST | `/api/v1/auth/login` | Login | 📋 Planned |
| GET | `/api/v1/auth/me` | Get current user | 📋 Planned |

### Stores
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/stores` | Create store | 📋 Planned |
| GET | `/api/v1/stores` | Get all stores | 📋 Planned |
| GET | `/api/v1/stores/:slug` | Get store by slug | 📋 Planned |
| PATCH | `/api/v1/stores/:slug` | Update store | 📋 Planned |

### Products
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/products` | Create product | 📋 Planned |
| GET | `/api/v1/products` | Get all products | 📋 Planned |
| GET | `/api/v1/products/:id` | Get product | 📋 Planned |
| PATCH | `/api/v1/products/:id` | Update product | 📋 Planned |
| DELETE | `/api/v1/products/:id` | Delete product | 📋 Planned |

### Cart
| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/api/v1/cart` | Get cart | 📋 Planned |
| POST | `/api/v1/cart` | Add item to cart | 📋 Planned |
| PATCH | `/api/v1/cart/:itemId` | Update cart item | 📋 Planned |
| DELETE | `/api/v1/cart/:itemId` | Remove cart item | 📋 Planned |

### Orders
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/orders` | Create order | 📋 Planned |
| GET | `/api/v1/orders` | Get my orders | 📋 Planned |
| GET | `/api/v1/orders/:id` | Get order by id | 📋 Planned |
| PATCH | `/api/v1/orders/:id/status` | Update order status | 📋 Planned |

### Payments
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/payments/checkout` | Create Stripe checkout session | 📋 Planned |
| POST | `/api/v1/payments/webhook` | Stripe webhook handler | 📋 Planned |

### AI
| Method | Endpoint | Description | Status |
|---|---|---|---|
| POST | `/api/v1/ai/description` | Generate product description | 📋 Planned |
| POST | `/api/v1/ai/title` | Generate SEO title | 📋 Planned |
| GET | `/api/v1/ai/search` | Semantic product search | 📋 Planned |
| GET | `/api/v1/ai/recommendations` | Product recommendations | 📋 Planned |

### Admin
| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/api/v1/admin/users` | Get all users | 📋 Planned |
| GET | `/api/v1/admin/stores` | Get all stores | 📋 Planned |
| PATCH | `/api/v1/admin/stores/:id` | Approve or suspend store | 📋 Planned |
| GET | `/api/v1/admin/commissions` | Get commission report | 📋 Planned |

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

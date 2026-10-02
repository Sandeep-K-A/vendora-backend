const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const { handleStripeWebhook } = require("./controllers/webhook.controller");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const storeRoutes = require("./routes/store.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/address.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const orderRoutes = require("./routes/order.routes");
const searchRoutes = require("./routes/search.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// --- Core middleware ---
app.use(pinoHttp({ logger }));
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// --- Health check route ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Vendora backend is running" });
});

// --- Routes will be mounted here as we build them ---
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);

// --- 404 handler ---
app.use(notFound);

// --- Centralized error handler ---
app.use(errorHandler);

module.exports = app;

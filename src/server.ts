import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./lib/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import router from "./routes";
import cookieParser from "cookie-parser";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Vendora API running",
  });
});

app.use("/api/v1", router);
app.use(notFound);
app.use(errorHandler);

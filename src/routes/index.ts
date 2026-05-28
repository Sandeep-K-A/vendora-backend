import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";

const router = Router();

// modules will be registered here as we build them
router.use("/auth", authRouter);

export default router;

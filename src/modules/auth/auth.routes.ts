import { Router } from "express";
import {
  loginController,
  refreshController,
  registerController,
} from "./auth.controller";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh", refreshController);

export default router;

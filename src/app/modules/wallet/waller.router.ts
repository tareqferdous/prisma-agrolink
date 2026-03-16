import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { walletController } from "./wallet.controller";

const router = Router();

router.get("/", requireAuth("FARMER"), walletController.getWallet);

export const walletRoutes = router;

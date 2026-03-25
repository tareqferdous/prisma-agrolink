import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { farmerController } from "./farmer.controller";

const router = Router();

router.get("/analytics", requireAuth("FARMER"), farmerController.getAnalytics);

export const farmerRoutes = router;

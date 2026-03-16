import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { usersController } from "./users.controller";

const router = Router();

router.get("/profile", requireAuth(), usersController.getProfile);
router.patch("/profile", requireAuth(), usersController.updateProfile);

export const userRoutes = router;

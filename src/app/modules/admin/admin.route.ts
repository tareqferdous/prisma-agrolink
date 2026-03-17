import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { adminController } from "./admin.controller";

const router = Router();

router.get("/users", requireAuth("ADMIN"), adminController.getUsers);
router.patch("/users/:id", requireAuth("ADMIN"), adminController.updateUser);
router.get("/listings", requireAuth("ADMIN"), adminController.getListings);
router.patch(
  "/listings/:id/approve",
  requireAuth("ADMIN"),
  adminController.approveListing,
);
router.patch(
  "/listings/:id/reject",
  requireAuth("ADMIN"),
  adminController.rejectListing,
);
router.get("/orders", requireAuth("ADMIN"), adminController.getOrders);
router.get("/analytics", requireAuth("ADMIN"), adminController.getAnalytics);

export const adminRoutes = router;

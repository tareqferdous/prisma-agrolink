import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { OrdersController } from "./order.controller";

const router = Router();

// Farmer + Buyer
router.get("/my", requireAuth("FARMER", "BUYER"), OrdersController.getMyOrders);
router.get(
  "/:id",
  requireAuth("FARMER", "BUYER"),
  OrdersController.getOrderById,
);

// Buyer only
router.post(
  "/:id/pay",
  requireAuth("BUYER"),
  OrdersController.createPaymentIntent,
);
router.patch(
  "/:id/confirm-payment",
  requireAuth("BUYER"),
  OrdersController.confirmPayment,
);
router.patch(
  "/:id/confirm-received",
  requireAuth("BUYER"),
  OrdersController.confirmReceived,
);

router.patch(
  "/:id/ready-pickup",
  requireAuth("FARMER"),
  OrdersController.readyForPickup,
);
router.patch("/:id/ship", requireAuth("FARMER"), OrdersController.shipOrder);

export const ordersRoutes = router;

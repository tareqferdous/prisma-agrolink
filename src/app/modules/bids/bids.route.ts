import { Router } from "express";
import {
  requireAuth,
  requireVerified,
} from "../../middlewares/auth.middleware";
import { bidController } from "./bids.controller";

const router = Router();

// Buyer — place bid on a listing
router.post(
  "/listings/:id/bids",
  requireAuth("BUYER"),
  requireVerified,
  bidController.placeBid,
);

// Farmer — view bids on own listing
router.get(
  "/listings/:id/bids",
  requireAuth("FARMER"),
  bidController.getBidsListing,
);

// Buyer — own bid history
router.get("/bids/my", requireAuth("BUYER"), bidController.getMyBids);

// Farmer — accept a bid
router.patch(
  "/bids/:id/accept",
  requireAuth("FARMER"),
  bidController.acceptBid,
);

export const bidsRoutes = router;

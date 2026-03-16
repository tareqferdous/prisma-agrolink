import { Router } from "express";
import {
  requireAuth,
  requireVerified,
} from "../../middlewares/auth.middleware";
import { listingController } from "./listings.controller";

const router = Router();

// Farmer only
router.get("/my", requireAuth("FARMER"), listingController.getMyListings);
router.post(
  "/",
  requireAuth("FARMER"),
  requireVerified,
  listingController.createListing,
);
router.patch("/:id", requireAuth("FARMER"), listingController.updateListing);
router.delete("/:id", requireAuth("FARMER"), listingController.deleteListing);

// Public routes
router.get("/", listingController.getAllListings);
router.get("/:id", listingController.getListingById);

export const listingRoutes = router;

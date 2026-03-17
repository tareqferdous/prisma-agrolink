import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { reviewsController } from "./reviews.controller";

const orderReviewRouter = Router({ mergeParams: true });
const userReviewRouter = Router({ mergeParams: true });

orderReviewRouter.post(
  "/",
  requireAuth("FARMER", "BUYER"),
  reviewsController.createReview,
);

userReviewRouter.get("/", reviewsController.getUserReviews);

export { orderReviewRouter, userReviewRouter };

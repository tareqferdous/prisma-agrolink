import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { reviewsService } from "./reviews.service";
import { createReviewSchema } from "./reviews.validation";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const validated = createReviewSchema.parse(req.body);
  const review = await reviewsService.createReview(
    req.params.id as string,
    req.user!.id,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Review submitted successfully",
    data: review,
  });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewsService.getUserReviews(req.params.id as string);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched successfully",
    data: result,
  });
});

export const reviewsController = {
  createReview,
  getUserReviews,
};

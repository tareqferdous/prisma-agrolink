import httpStatus from "http-status";
import { OrderStatus } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TCreateReview } from "./reviews.validation";

const createReview = async (
  orderId: string,
  reviewerId: string,
  data: TCreateReview,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderStatus: true,
      farmerId: true,
      buyerId: true,
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Order must be completed to review
  if (order.orderStatus !== OrderStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Order must be COMPLETED before reviewing",
    );
  }

  // Reviewer will be either farmer or buyer of the order
  if (order.farmerId !== reviewerId && order.buyerId !== reviewerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  // Determine reviewee (the other party in the order)
  const revieweeId =
    reviewerId === order.farmerId ? order.buyerId : order.farmerId;

  // Already reviewed check
  const existing = await prisma.review.findUnique({
    where: {
      orderId_reviewerId: { orderId, reviewerId },
    },
  });

  if (existing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this order",
    );
  }

  const review = await prisma.review.create({
    data: {
      orderId,
      reviewerId,
      revieweeId,
      rating: data.rating,
      comment: data.comment,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      reviewee: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return review;
};

//  user reviews + average rating
const getUserReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    reviews,
  };
};

export const reviewsService = {
  createReview,
  getUserReviews,
};

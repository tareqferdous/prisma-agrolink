import httpStatus from "http-status";
import { ListingStatus, OrderStatus } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const getFarmerAnalytics = async (farmerId: string) => {
  const [
    totalListings,
    activeListings,
    pendingOrders,
    completedOrders,
    totalBids,
    farmer,
  ] = await prisma.$transaction([
    prisma.listing.count({
      where: {
        farmerId,
        isDeleted: false,
      },
    }),
    prisma.listing.count({
      where: {
        farmerId,
        status: ListingStatus.ACTIVE,
        isDeleted: false,
      },
    }),
    prisma.order.count({
      where: {
        farmerId,
        orderStatus: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID],
        },
      },
    }),
    prisma.order.count({
      where: {
        farmerId,
        orderStatus: OrderStatus.COMPLETED,
      },
    }),
    prisma.bid.count({
      where: {
        listing: {
          farmerId,
          status: ListingStatus.ACTIVE,
          isDeleted: false,
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: farmerId },
      select: { walletBalance: true },
    }),
  ]);

  if (!farmer) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    totalListings,
    activeListings,
    totalEarnings: farmer.walletBalance,
    pendingOrders,
    completedOrders,
    totalBids,
  };
};

export const farmerService = {
  getFarmerAnalytics,
};

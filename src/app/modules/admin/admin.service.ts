import httpStatus from "http-status";
import { ListingStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { TOrderFilter, TRejectListing, TUpdateUser } from "./admin.validation";

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      location: true,
      companyName: true,
      isVerified: true,
      isBanned: true,
      walletBalance: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

const updateUser = async (userId: string, data: TUpdateUser) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isBanned: true,
    },
  });

  return updated;
};

const getPendingListings = async () => {
  const listings = await prisma.listing.findMany({
    where: {
      status: ListingStatus.PENDING_APPROVAL,
      isDeleted: false,
    },
    select: {
      id: true,
      cropName: true,
      quantity: true,
      unit: true,
      minPricePerUnit: true,
      description: true,
      harvestDate: true,
      location: true,
      deliveryOptions: true,
      images: true,
      status: true,
      createdAt: true,
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return listings;
};

const approveListing = async (listingId: string) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      isDeleted: false,
    },
    include: {
      farmer: { select: { email: true } },
    },
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  }

  if (listing.status !== ListingStatus.PENDING_APPROVAL) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only PENDING_APPROVAL listings can be approved",
    );
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: ListingStatus.ACTIVE,
      adminNote: null,
    },
    select: {
      id: true,
      cropName: true,
      status: true,
    },
  });

  // Send approval email to farmer
  await sendListingApprovedEmail(listing.farmer.email, listing.cropName);

  return updated;
};

const rejectListing = async (listingId: string, data: TRejectListing) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      isDeleted: false,
    },
    include: {
      farmer: { select: { email: true } },
    },
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  }

  if (listing.status !== ListingStatus.PENDING_APPROVAL) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only PENDING_APPROVAL listings can be rejected",
    );
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: ListingStatus.REJECTED,
      adminNote: data.adminNote,
    },
    select: {
      id: true,
      cropName: true,
      status: true,
      adminNote: true,
    },
  });

  // Send rejection email to farmer with admin note
  await sendListingRejectedEmail(
    listing.farmer.email,
    listing.cropName,
    data.adminNote,
  );

  return updated;
};

const getAllOrders = async (filters: TOrderFilter) => {
  const { status, page, limit } = filters;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where = status ? { orderStatus: status as any } : {};

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        cropPrice: true,
        shippingCost: true,
        platformFee: true,
        farmerAmount: true,
        totalAmount: true,
        deliveryMethod: true,
        courierName: true,
        trackingNumber: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
        listing: {
          select: {
            cropName: true,
            quantity: true,
            unit: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getAnalytics = async () => {
  const [totalUsers, totalOrders, activeListings, platformRevenue] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.order.count(),
      prisma.listing.count({
        where: {
          status: ListingStatus.ACTIVE,
          isDeleted: false,
        },
      }),
      prisma.order.aggregate({
        _sum: { platformFee: true },
        where: { orderStatus: "COMPLETED" },
      }),
    ]);

  return {
    totalUsers,
    totalOrders,
    activeListings,
    platformRevenue: platformRevenue._sum.platformFee ?? 0,
  };
};

export const adminService = {
  getAllUsers,
  updateUser,
  getPendingListings,
  approveListing,
  rejectListing,
  getAllOrders,
  getAnalytics,
};

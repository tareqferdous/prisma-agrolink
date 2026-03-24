import httpStatus from "http-status";
import { BidStatus, ListingStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { sendBidAcceptedEmail, sendBidRejectedEmail } from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { TPlaceBid } from "./bids.validation";

export const placeBid = async (
  listingId: string,
  buyerId: string,
  data: TPlaceBid,
) => {
  // Listing exists and active check
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      isDeleted: false,
      status: ListingStatus.ACTIVE,
    },
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found or not active");
  }

  // Farmer cannot bid on own listing check
  if (listing.farmerId === buyerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You cannot bid on your own listing",
    );
  }

  // minPricePerUnit check
  if (listing.minPricePerUnit && data.bidAmount < listing.minPricePerUnit) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Bid amount must be at least ৳${listing.minPricePerUnit} per unit`,
    );
  }

  // Upsert — if same buyer: update, otherwise create new bid
  const bid = await prisma.bid.upsert({
    where: {
      listingId_buyerId: { listingId, buyerId },
    },
    update: {
      bidAmount: data.bidAmount,
      buyerNote: data.buyerNote ?? null,
      bidStatus: BidStatus.PENDING,
    },
    create: {
      listingId,
      buyerId,
      bidAmount: data.bidAmount,
      buyerNote: data.buyerNote ?? null,
    },
    select: {
      id: true,
      bidAmount: true,
      buyerNote: true,
      bidStatus: true,
      createdAt: true,
      updatedAt: true,
      buyer: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });

  return bid;
};

const getListingBids = async (listingId: string, farmerId: string) => {
  // Listing ownership check
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      farmerId,
      isDeleted: false,
    },
  });

  if (!listing) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Listing not found or you don't own this listing",
    );
  }

  const bids = await prisma.bid.findMany({
    where: { listingId },
    select: {
      id: true,
      bidAmount: true,
      buyerNote: true,
      bidStatus: true,
      createdAt: true,
      buyer: {
        select: {
          id: true,
          name: true,
          location: true,
          phone: true,
        },
      },
    },
    orderBy: { bidAmount: "desc" }, // highest bid first
  });

  return bids;
};

// Get all bids placed by a buyer
const getMyBids = async (buyerId: string) => {
  const bids = await prisma.bid.findMany({
    where: { buyerId },
    select: {
      id: true,
      bidAmount: true,
      buyerNote: true,
      bidStatus: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          cropName: true,
          quantity: true,
          unit: true,
          location: true,
          status: true,
          farmer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bids;
};

const acceptBid = async (bidId: string, farmerId: string) => {
  // Bid exists check
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      listing: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!bid) {
    throw new AppError(httpStatus.NOT_FOUND, "Bid not found");
  }

  // Listing ownership check
  if (bid.listing.farmerId !== farmerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only accept bids on your own listings",
    );
  }

  // Listing active check
  if (bid.listing.status !== ListingStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, "Listing is not active");
  }

  // Already accepted check
  if (bid.bidStatus === BidStatus.ACCEPTED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Bid already accepted");
  }

  // Check if order already exists (race condition from concurrent accept requests)
  const existingOrder = await prisma.order.findUnique({
    where: { bidId: bidId },
  });

  if (existingOrder) {
    // Order already created by concurrent request, return existing order
    return {
      bid: { ...bid, bidStatus: BidStatus.ACCEPTED },
      order: {
        id: existingOrder.id,
        cropPrice: existingOrder.cropPrice,
        platformFee: existingOrder.platformFee,
        farmerAmount: existingOrder.farmerAmount,
        totalAmount: existingOrder.totalAmount,
        deliveryMethod: existingOrder.deliveryMethod,
        orderStatus: existingOrder.orderStatus,
        paymentStatus: existingOrder.paymentStatus,
      },
      buyer: bid.buyer,
      cropName: bid.listing.cropName,
    };
  }

  // Payment calculation
  const cropPrice = bid.bidAmount * bid.listing.quantity;
  const platformFee = Math.round(cropPrice * 0.03);
  const farmerAmount = cropPrice - platformFee;
  const totalAmount = cropPrice + platformFee;

  // Update bid status and listing status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Selected bid → ACCEPTED
    const acceptedBid = await tx.bid.update({
      where: { id: bidId },
      data: { bidStatus: BidStatus.ACCEPTED },
    });

    // remaining bids → REJECTED
    await tx.bid.updateMany({
      where: {
        listingId: bid.listingId,
        id: { not: bidId },
      },
      data: { bidStatus: BidStatus.REJECTED },
    });

    // Listing status → CLOSED
    await tx.listing.update({
      where: { id: bid.listingId },
      data: { status: ListingStatus.CLOSED },
    });

    // Create order record
    const order = await tx.order.create({
      data: {
        listingId: bid.listingId,
        bidId: bid.id,
        farmerId: bid.listing.farmerId,
        buyerId: bid.buyerId,
        cropPrice,
        platformFee,
        farmerAmount,
        totalAmount,
        deliveryMethod: bid.listing.deliveryOptions[0] || "PICKUP",
      },
      select: {
        id: true,
        cropPrice: true,
        platformFee: true,
        farmerAmount: true,
        totalAmount: true,
        deliveryMethod: true,
        orderStatus: true,
        paymentStatus: true,
      },
    });

    return { acceptedBid, order };
  });

  // email to Winner buyer
  await sendBidAcceptedEmail(
    bid.buyer.email,
    bid.listing.cropName,
    result.order.totalAmount,
    result.order.id,
  );

  // email to Rejected buyers
  const rejectedBids = await prisma.bid.findMany({
    where: {
      listingId: bid.listingId,
      id: { not: bidId },
    },
    select: {
      buyer: {
        select: { email: true },
      },
    },
  });

  await Promise.all(
    rejectedBids.map((b) =>
      sendBidRejectedEmail(b.buyer.email, bid.listing.cropName),
    ),
  );

  return {
    bid: result.acceptedBid,
    order: result.order,
    buyer: bid.buyer,
    cropName: bid.listing.cropName,
  };
};

export const bidService = {
  placeBid,
  getListingBids,
  getMyBids,
  acceptBid,
};

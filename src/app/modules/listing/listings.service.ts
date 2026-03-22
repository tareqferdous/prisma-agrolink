import httpStatus from "http-status";
import { ListingStatus } from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import {
  TCreateListing,
  TListingFilter,
  TUpdateListing,
} from "./listings.validation";

const listingSelectFields = {
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
  adminNote: true,
  createdAt: true,
  updatedAt: true,
  farmer: {
    select: {
      id: true,
      name: true,
      location: true,
      phone: true,
    },
  },
};

const getAllListings = async (filters: TListingFilter) => {
  const {
    cropName,
    category,
    location,
    minPrice,
    maxPrice,
    harvestDate,
    deliveryOptions,
    page,
    limit,
  } = filters;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    status: ListingStatus.ACTIVE,
    isDeleted: false,
    ...(cropName && {
      cropName: { contains: cropName, mode: "insensitive" },
    }),
    ...(category && { category }),
    ...(location && {
      location: { contains: location, mode: "insensitive" },
    }),
    ...(minPrice && {
      minPricePerUnit: { gte: parseFloat(minPrice) },
    }),
    ...(maxPrice && {
      minPricePerUnit: { lte: parseFloat(maxPrice) },
    }),
    ...(harvestDate && {
      harvestDate: { gte: new Date(harvestDate) },
    }),
    ...(deliveryOptions && {
      deliveryOptions: { has: deliveryOptions },
    }),
  };

  // Active listings এর base where — filter ছাড়া
  const activeWhere = {
    status: ListingStatus.ACTIVE,
    isDeleted: false,
  };

  const [listings, total, locations, priceStats, activeCategories] =
    await Promise.all([
      // Filtered listings
      prisma.listing.findMany({
        where,
        select: listingSelectFields,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),

      // Filtered count
      prisma.listing.count({ where }),

      // Meta — unique locations (unfiltered)
      prisma.listing.findMany({
        where: activeWhere,
        select: { location: true },
        distinct: ["location"],
        orderBy: { location: "asc" },
      }),

      // Meta — price range (unfiltered)
      prisma.listing.aggregate({
        where: {
          ...activeWhere,
          minPricePerUnit: { not: null },
        },
        _min: { minPricePerUnit: true },
        _max: { minPricePerUnit: true },
      }),

      // Meta — active categories (unfiltered)
      prisma.listing.findMany({
        where: activeWhere,
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
    ]);

  return {
    listings,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    filterMeta: {
      locations: locations.map((l) => l.location),
      priceRange: {
        min: priceStats._min.minPricePerUnit ?? 0,
        max: priceStats._max.minPricePerUnit ?? 10000,
      },
      categories: activeCategories.map((c) => c.category),
    },
  };
};

// const getListingsMeta = async () => {
//   const [locations, priceStats, activeCategories] = await Promise.all([
//     prisma.listing.findMany({
//       where: { status: ListingStatus.ACTIVE, isDeleted: false },
//       select: { location: true },
//       distinct: ["location"],
//       orderBy: { location: "asc" },
//     }),

//     prisma.listing.aggregate({
//       where: {
//         status: ListingStatus.ACTIVE,
//         isDeleted: false,
//         minPricePerUnit: { not: null },
//       },
//       _min: { minPricePerUnit: true },
//       _max: { minPricePerUnit: true },
//     }),

//     prisma.listing.findMany({
//       where: { status: ListingStatus.ACTIVE, isDeleted: false },
//       select: { category: true },
//       distinct: ["category"],
//       orderBy: { category: "asc" },
//     }),
//   ]);

//   return {
//     locations: locations.map((l) => l.location),
//     priceRange: {
//       min: priceStats._min.minPricePerUnit ?? 0,
//       max: priceStats._max.minPricePerUnit ?? 10000,
//     },
//     categories: activeCategories.map((c) => c.category),
//   };
// };

const getMyListings = async (farmerId: string) => {
  const listings = await prisma.listing.findMany({
    where: {
      farmerId,
      isDeleted: false,
    },
    select: listingSelectFields,
    orderBy: { createdAt: "desc" },
  });

  return listings;
};

const getListingById = async (id: string) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: listingSelectFields,
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  }

  return listing;
};

const createListing = async (farmerId: string, data: TCreateListing) => {
  const listing = await prisma.listing.create({
    data: {
      ...data,
      farmerId,
      harvestDate: new Date(data.harvestDate),
      status: ListingStatus.PENDING_APPROVAL,
    },
    select: listingSelectFields,
  });

  return listing;
};

const updateListing = async (
  id: string,
  farmerId: string,
  data: TUpdateListing,
) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  }

  if (listing.farmerId !== farmerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only edit your own listings",
    );
  }

  if (
    listing.status !== ListingStatus.PENDING_APPROVAL &&
    listing.status !== ListingStatus.ACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only PENDING_APPROVAL or ACTIVE listings can be edited",
    );
  }

  const hasOrder = await prisma.order.findFirst({ where: { listingId: id } });
  if (hasOrder) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot edit listing with existing order",
    );
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      ...(data.harvestDate && { harvestDate: new Date(data.harvestDate) }),
    },
    select: listingSelectFields,
  });

  return updated;
};

const deleteListing = async (id: string, farmerId: string) => {
  const listing = await prisma.listing.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!listing) {
    throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  }

  if (listing.farmerId !== farmerId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only delete your own listings",
    );
  }

  if (
    listing.status !== ListingStatus.PENDING_APPROVAL &&
    listing.status !== ListingStatus.ACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only PENDING_APPROVAL or ACTIVE listings can be deleted",
    );
  }

  const hasOrder = await prisma.order.findFirst({ where: { listingId: id } });
  if (hasOrder) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete listing with existing order",
    );
  }

  await prisma.listing.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

export const listingService = {
  createListing,
  getMyListings,
  updateListing,
  deleteListing,
  getListingById,
  getAllListings,
  // getListingsMeta,
};

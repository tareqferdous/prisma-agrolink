import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { listingService } from "./listings.service";
import {
  createListingSchema,
  listingFilterSchema,
  updateListingSchema,
} from "./listings.validation";

const createListing = catchAsync(async (req: Request, res: Response) => {
  const validated = createListingSchema.parse(req.body);
  const listing = await listingService.createListing(req.user!.id, validated);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Listing created successfully",
    data: listing,
  });
});

const getMyListings = catchAsync(async (req: Request, res: Response) => {
  const listings = await listingService.getMyListings(req.user!.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Your listings fetched successfully",
    data: listings,
  });
});

const updateListing = catchAsync(async (req: Request, res: Response) => {
  const validated = updateListingSchema.parse(req.body);
  const listing = await listingService.updateListing(
    req.params.id as string,
    req.user!.id,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listing updated successfully",
    data: listing,
  });
});

const deleteListing = catchAsync(async (req: Request, res: Response) => {
  await listingService.deleteListing(req.params.id as string, req.user!.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listing deleted successfully",
  });
});

const getListingById = catchAsync(async (req: Request, res: Response) => {
  const listing = await listingService.getListingById(req.params.id as string);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listing fetched successfully",
    data: listing,
  });
});

const getAllListings = catchAsync(async (req: Request, res: Response) => {
  const filters = listingFilterSchema.parse(req.query);
  const result = await listingService.getAllListings(filters);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listings fetched successfully",
    data: result.listings,
    meta: result.meta,
    filterMeta: result.filterMeta,
  });
});

// const getMeta = catchAsync(async (req: Request, res: Response) => {
//   const meta = await listingService.getListingsMeta();

//   sendResponse(res, {
//     httpStatusCode: httpStatus.OK,
//     success: true,
//     message: "Listings meta fetched successfully",
//     data: meta,
//   });
// });

export const listingController = {
  createListing,
  getMyListings,
  updateListing,
  deleteListing,
  getListingById,
  getAllListings,
  // getMeta,
};

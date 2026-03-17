import { Request, Response } from "express";
import httpStatus from "http-status";
import {
  orderFilterSchema,
  rejectListingSchema,
  updateUserSchema,
} from "./admin.validation";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { adminService } from "./admin.service";

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await adminService.getAllUsers();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: users,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const validated = updateUserSchema.parse(req.body);
  const user = await adminService.updateUser(
    req.params.id as string,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

const getListings = catchAsync(async (req: Request, res: Response) => {
  const listings = await adminService.getPendingListings();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Pending listings fetched successfully",
    data: listings,
  });
});

const approveListing = catchAsync(async (req: Request, res: Response) => {
  const listing = await adminService.approveListing(req.params.id as string);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listing approved successfully",
    data: listing,
  });
});

const rejectListing = catchAsync(async (req: Request, res: Response) => {
  const validated = rejectListingSchema.parse(req.body);
  const listing = await adminService.rejectListing(
    req.params.id as string,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Listing rejected successfully",
    data: listing,
  });
});

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const filters = orderFilterSchema.parse(req.query);
  const result = await adminService.getAllOrders(filters);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully",
    data: result.orders,
    meta: result.meta,
  });
});

const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Analytics fetched successfully",
    data: analytics,
  });
});

export const adminController = {
  getUsers,
  updateUser,
  getListings,
  approveListing,
  rejectListing,
  getOrders,
  getAnalytics,
};

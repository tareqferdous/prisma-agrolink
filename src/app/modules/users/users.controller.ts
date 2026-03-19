import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { usersService } from "./users.service";
import { updateProfileSchema } from "./users.validation";

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.user!.id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const validated = updateProfileSchema.parse(req.body);

  const user = await usersService.updateUserProfile(req.user!.id, validated);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await usersService.getUserProfileById(req.params.id as string);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});

export const usersController = {
  getProfile,
  updateProfile,
  getUserProfile,
};

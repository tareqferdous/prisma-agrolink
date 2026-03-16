import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { auth } from "../../lib/auth";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { authService } from "./auth.service";

const getMe = catchAsync(async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized — please login");
  }

  const user = await authService.getMeFromDB(session.user.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});

export const authController = {
  getMe,
};

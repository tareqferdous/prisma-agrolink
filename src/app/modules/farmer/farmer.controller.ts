import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { farmerService } from "./farmer.service";

const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const analytics = await farmerService.getFarmerAnalytics(req.user!.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Farmer analytics fetched successfully",
    data: analytics,
  });
});

export const farmerController = {
  getAnalytics,
};

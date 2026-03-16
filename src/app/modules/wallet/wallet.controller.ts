import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { walletService } from "./wallet.service";

const getWallet = catchAsync(async (req: Request, res: Response) => {
  const result = await walletService.getWallet(req.user!.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Wallet fetched successfully",
    data: result,
  });
});

export const walletController = {
  getWallet,
};

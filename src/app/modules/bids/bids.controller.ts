import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { bidService } from "./bids.service";
import { placeBidSchema } from "./bids.validation";

const placeBid = catchAsync(async (req: Request, res: Response) => {
  const validated = placeBidSchema.parse(req.body);
  const bid = await bidService.placeBid(
    req.params.id as string,
    req.user!.id,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Bid placed successfully",
    data: bid,
  });
});

const getBidsListing = catchAsync(async (req: Request, res: Response) => {
  const bids = await bidService.getListingBids(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Bids fetched successfully",
    data: bids,
  });
});

const getMyBids = catchAsync(async (req: Request, res: Response) => {
  const bids = await bidService.getMyBids(req.user!.id);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Your bids fetched successfully",
    data: bids,
  });
});

const acceptBid = catchAsync(async (req: Request, res: Response) => {
  const result = await bidService.acceptBid(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Bid accepted successfully — order created",
    data: result,
  });
});

export const bidController = {
  placeBid,
  getBidsListing,
  getMyBids,
  acceptBid,
};

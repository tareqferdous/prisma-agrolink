import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { OrdersService } from "./orders.service";
import { confirmPaymentSchema, shipOrderSchema } from "./orders.validation";

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await OrdersService.getMyOrders(req.user!.id, req.user!.role);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully",
    data: orders,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const order = await OrdersService.getOrderById(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
});

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const result = await OrdersService.createPaymentIntent(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Payment intent created",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const validated = confirmPaymentSchema.parse(req.body);
  const order = await OrdersService.confirmPayment(
    req.params.id as string,
    req.user!.id,
    validated.paymentIntentId,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Payment confirmed successfully",
    data: order,
  });
});

const confirmReceived = catchAsync(async (req: Request, res: Response) => {
  const order = await OrdersService.confirmReceived(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Order completed — payment released to farmer",
    data: order,
  });
});

const readyForPickup = catchAsync(async (req: Request, res: Response) => {
  const order = await OrdersService.markReadyForPickup(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Order marked as ready for pickup",
    data: order,
  });
});

const shipOrder = catchAsync(async (req: Request, res: Response) => {
  const validated = shipOrderSchema.parse(req.body);
  const order = await OrdersService.shipOrder(
    req.params.id as string,
    req.user!.id,
    validated,
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Order shipped successfully",
    data: order,
  });
});

export const OrdersController = {
  getMyOrders,
  getOrderById,
  createPaymentIntent,
  confirmPayment,
  confirmReceived,
  readyForPickup,
  shipOrder,
};

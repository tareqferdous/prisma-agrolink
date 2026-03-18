import httpStatus from "http-status";
import {
  DeliveryOption,
  OrderStatus,
  PaymentStatus,
} from "../../../generated/prisma/client";
import AppError from "../../errorHelpers/AppError";
import {
  sendOrderCompletedEmail,
  sendOrderShippedEmail,
} from "../../lib/mailer";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { TShipOrder } from "./orders.validation";

const orderSelectFields = {
  id: true,
  cropPrice: true,
  shippingCost: true,
  platformFee: true,
  farmerAmount: true,
  totalAmount: true,
  deliveryMethod: true,
  courierName: true,
  trackingNumber: true,
  paymentStatus: true,
  orderStatus: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      id: true,
      cropName: true,
      quantity: true,
      unit: true,
      location: true,
      images: true,
    },
  },
  farmer: {
    select: {
      id: true,
      name: true,
      phone: true,
      location: true,
    },
  },
  buyer: {
    select: {
      id: true,
      name: true,
      phone: true,
      location: true,
    },
  },
};

const getMyOrders = async (userId: string, role: string) => {
  const where = role === "FARMER" ? { farmerId: userId } : { buyerId: userId };

  const orders = await prisma.order.findMany({
    where,
    select: orderSelectFields,
    orderBy: { createdAt: "desc" },
  });

  return orders;
};

const getOrderById = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: orderSelectFields,
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Ownership check — farmer or buyer
  if (order.farmer.id !== userId && order.buyer.id !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  return order;
};

const createPaymentIntent = async (orderId: string, buyerId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      listing: { select: { cropName: true } },
      buyer: { select: { id: true, email: true } },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.buyerId !== buyerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (order.paymentStatus !== PaymentStatus.UNPAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order already paid");
  }

  // Stripe amount in paisa (BDT × 100)
  const amountInPaisa = Math.round(order.totalAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInPaisa,
    currency: "bdt",
    payment_method_types: ["card"],
    metadata: {
      orderId: order.id,
      buyerId: order.buyerId,
      cropName: order.listing.cropName,
    },
  });

  // PaymentIntent ID save করো
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentIntentId: paymentIntent.id },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    totalAmount: order.totalAmount,
    cropName: order.listing.cropName,
  };
};

const confirmPayment = async (
  orderId: string,
  buyerId: string,
  paymentIntentId: string,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.buyerId !== buyerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment already confirmed");
  }

  // verify payment status with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Payment not completed. Status: ${paymentIntent.status}`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.PAID,
      paymentIntentId,
    },
    select: orderSelectFields,
  });

  return updated;
};

const confirmReceived = async (orderId: string, buyerId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      farmer: { select: { id: true, email: true, name: true } },
      listing: { select: { cropName: true } },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.buyerId !== buyerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order not paid yet");
  }

  if (order.orderStatus === OrderStatus.COMPLETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order already completed");
  }

  if (
    order.orderStatus !== OrderStatus.READY_FOR_PICKUP &&
    order.orderStatus !== OrderStatus.SHIPPED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Order must be READY_FOR_PICKUP or SHIPPED before confirming",
    );
  }

  // transaction
  const result = await prisma.$transaction(async (tx) => {
    //  Order → COMPLETED, payment → RELEASED
    const completedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.RELEASED,
      },
      select: orderSelectFields,
    });

    // Farmer wallet update
    await tx.user.update({
      where: { id: order.farmerId },
      data: {
        walletBalance: { increment: order.farmerAmount },
      },
    });

    //  WalletTransaction record create
    await tx.walletTransaction.create({
      data: {
        farmerId: order.farmerId,
        orderId: order.id,
        amount: order.farmerAmount,
        type: "CREDIT",
      },
    });

    return completedOrder;
  });

  // Email notification to farmer
  await sendOrderCompletedEmail(
    order.farmer.email,
    order.listing.cropName,
    order.farmerAmount,
  );

  return result;
};

const markReadyForPickup = async (orderId: string, farmerId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.farmerId !== farmerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (order.orderStatus !== OrderStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Order must be PAID before marking ready for pickup",
    );
  }

  if (order.deliveryMethod !== DeliveryOption.PICKUP) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This order is not a pickup order",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: OrderStatus.READY_FOR_PICKUP },
    select: orderSelectFields,
  });

  return updated;
};

const shipOrder = async (
  orderId: string,
  farmerId: string,
  data: TShipOrder,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { email: true } },
      listing: { select: { cropName: true } },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.farmerId !== farmerId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (order.orderStatus !== OrderStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Order must be PAID before shipping",
    );
  }

  if (order.deliveryMethod !== DeliveryOption.COURIER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This order is not a courier order",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: OrderStatus.SHIPPED,
      courierName: data.courierName,
      trackingNumber: data.trackingNumber,
      shippingCost: data.shippingCost,
    },
    select: orderSelectFields,
  });

  // Email notification to buyer
  await sendOrderShippedEmail(
    order.buyer.email,
    order.listing.cropName,
    data.courierName,
    data.trackingNumber,
  );

  return updated;
};

export const OrdersService = {
  getMyOrders,
  getOrderById,
  createPaymentIntent,
  confirmPayment,
  confirmReceived,
  markReadyForPickup,
  shipOrder,
};

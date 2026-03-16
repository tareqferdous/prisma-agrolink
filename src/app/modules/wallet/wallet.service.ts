import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const getWallet = async (farmerId: string) => {
  const farmer = await prisma.user.findUnique({
    where: { id: farmerId },
    select: {
      walletBalance: true,
      walletTransactions: {
        select: {
          id: true,
          amount: true,
          type: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              listing: {
                select: {
                  cropName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!farmer) {
    throw new AppError(httpStatus.NOT_FOUND, "Farmer not found");
  }

  return {
    walletBalance: farmer.walletBalance,
    transactions: farmer.walletTransactions,
  };
};

export const walletService = {
  getWallet,
};

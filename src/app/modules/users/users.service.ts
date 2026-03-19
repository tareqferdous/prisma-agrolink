import httpStatus from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { TUpdateProfile } from "./users.validation";

const userSelectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  location: true,
  companyName: true,
  isVerified: true,
  walletBalance: true,
  createdAt: true,
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectFields,
  });

  return user;
};

const updateUserProfile = async (id: string, data: TUpdateProfile) => {
  const user = await prisma.user.update({
    where: { id },
    data,
    select: userSelectFields,
  });

  return user;
};

const getUserProfileById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
      location: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

export const usersService = {
  getUserById,
  updateUserProfile,
  getUserProfileById,
};

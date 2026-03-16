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

export const usersService = {
  getUserById,
  updateUserProfile,
};

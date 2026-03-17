import { z } from "zod";

export const updateUserSchema = z.object({
  isVerified: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  role: z.enum(["FARMER", "BUYER", "ADMIN"]).optional(),
});

export const rejectListingSchema = z.object({
  adminNote: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters"),
});

export const orderFilterSchema = z.object({
  status: z
    .enum(["PENDING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"])
    .optional(),
  page: z.string().default("1"),
  limit: z.string().default("10"),
});

export type TUpdateUser = z.infer<typeof updateUserSchema>;
export type TRejectListing = z.infer<typeof rejectListingSchema>;
export type TOrderFilter = z.infer<typeof orderFilterSchema>;

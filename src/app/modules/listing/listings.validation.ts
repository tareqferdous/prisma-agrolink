import { z } from "zod";

export const categoryEnum = z.enum([
  "VEGETABLES",
  "FRUITS",
  "GRAINS",
  "RICE",
  "PULSES",
  "SPICES",
  "DAIRY",
  "OTHERS",
]);

export const createListingSchema = z.object({
  cropName: z.string().min(2, "Crop name required"),
  category: categoryEnum,
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["KG", "MON", "TON"]),
  minPricePerUnit: z.number().positive().optional(),
  description: z.string().min(10).max(500).optional(),
  harvestDate: z.string().datetime("Invalid date format"),
  location: z.string().min(2, "Location required"),
  deliveryOptions: z
    .array(z.enum(["PICKUP", "COURIER"]))
    .min(1, "Select at least one delivery option"),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(3)
    .optional()
    .default([]),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFilterSchema = z.object({
  cropName: z.string().optional(),
  category: categoryEnum.optional(),
  location: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  harvestDate: z.string().optional(),
  deliveryOptions: z.enum(["PICKUP", "COURIER"]).optional(),
  page: z.string().default("1"),
  limit: z.string().default("10"),
});

export type TCreateListing = z.infer<typeof createListingSchema>;
export type TUpdateListing = z.infer<typeof updateListingSchema>;
export type TListingFilter = z.infer<typeof listingFilterSchema>;

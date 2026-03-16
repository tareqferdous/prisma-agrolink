import { z } from "zod";

export const createListingSchema = z.object({
  cropName: z.string().min(2, "Crop name must be at least 2 characters"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["KG", "MON", "TON"], {
    message: "Unit must be KG, MON or TON",
  }),
  minPricePerUnit: z.number().positive().optional(),
  description: z.string().min(10).max(500).optional(),
  harvestDate: z.string().datetime("Invalid date format"),
  location: z.string().min(2, "Location is required"),
  deliveryOptions: z
    .array(z.enum(["PICKUP", "COURIER"]))
    .min(1, "At least one delivery option required"),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(3, "Maximum 3 images allowed")
    .optional()
    .default([]),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFilterSchema = z.object({
  cropName: z.string().optional(),
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

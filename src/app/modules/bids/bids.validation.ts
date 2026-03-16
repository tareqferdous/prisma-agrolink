import { z } from "zod";

export const placeBidSchema = z.object({
  bidAmount: z.number().positive("Bid amount must be positive"),
  buyerNote: z.string().max(200).optional(),
});

export type TPlaceBid = z.infer<typeof placeBidSchema>;

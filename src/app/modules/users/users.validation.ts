import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().min(11).max(15).optional(),
  location: z.string().min(2).max(50).optional(),
  companyName: z.string().min(2).max(100).optional(),
});

export type TUpdateProfile = z.infer<typeof updateProfileSchema>;

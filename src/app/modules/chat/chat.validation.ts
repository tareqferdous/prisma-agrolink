import z from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export type TChatRequest = z.infer<typeof chatRequestSchema>;

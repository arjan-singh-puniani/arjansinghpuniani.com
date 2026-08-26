import { z } from "zod";
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email address."),
  category: z.enum(["Research collaboration", "Clinical translation", "Speaking or teaching", "Neurotechnology", "Motorsport medicine", "Media", "Other"]),
  message: z.string().trim().min(20, "Please provide at least 20 characters.").max(4000),
  website: z.string().max(0).optional().default("")
});
export type ContactInput = z.infer<typeof contactSchema>;

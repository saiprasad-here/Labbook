import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(60, { message: "Name must be less than 60 characters" })
  .regex(/^[a-zA-Z.\s'-]+$/, { message: "Only letters, spaces, dots, hyphens allowed" });

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Enter a valid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password must be less than 72 characters" })
  .regex(/[A-Z]/, { message: "Must include an uppercase letter" })
  .regex(/[a-z]/, { message: "Must include a lowercase letter" })
  .regex(/[0-9]/, { message: "Must include a number" });

const branchSchema = z
  .string()
  .trim()
  .min(2, { message: "Branch is required" })
  .max(40, { message: "Branch must be less than 40 characters" });

const studentRegSchema = z
  .string()
  .trim()
  .min(4, { message: "Registration No. is required" })
  .max(20, { message: "Registration No. must be less than 20 characters" })
  .regex(/^[A-Za-z0-9-]+$/, { message: "Only letters, numbers, hyphens allowed" });

const facultyIdSchema = z
  .string()
  .trim()
  .min(3, { message: "Faculty ID is required" })
  .max(20, { message: "Faculty ID must be less than 20 characters" })
  .regex(/^[A-Za-z0-9-]+$/, { message: "Only letters, numbers, hyphens allowed" });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
  role: z.enum(["student", "faculty", "admin"]),
});

export const signupSchema = z.object({
  role: z.enum(["student", "faculty", "admin"]),
  name: nameSchema,
  email: emailSchema,
  branch: z.string().optional(),
  registrationId: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, { message: "You must accept the terms" }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords do not match" });
  }
  if (data.role === "student" || data.role === "faculty") {
    const branchRes = branchSchema.safeParse(data.branch);
    if (!branchRes.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["branch"], message: branchRes.error.issues[0].message });
    }
    const regSchema = data.role === "faculty" ? facultyIdSchema : studentRegSchema;
    const regRes = regSchema.safeParse(data.registrationId);
    if (!regRes.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["registrationId"], message: regRes.error.issues[0].message });
    }
  }
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 25, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score: 50, label: "Fair", color: "bg-warning" };
  if (score <= 4) return { score: 75, label: "Good", color: "bg-info" };
  return { score: 100, label: "Strong", color: "bg-success" };
}

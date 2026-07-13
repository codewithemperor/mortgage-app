import { z } from "zod";

export const loanApplicationSchema = z.object({
  borrowerId: z.string().min(1, "Borrower is required"),
  propertyId: z.string().optional(),
  packageId: z.string().optional(),
  loanAmount: z
    .string()
    .min(1, "Loan amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Loan amount must be a positive number"
    ),
  interestRate: z
    .string()
    .min(1, "Interest rate is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 50,
      "Interest rate must be between 0 and 50%"
    ),
  loanTermMonths: z
    .string()
    .min(1, "Loan term is required")
    .refine(
      (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) <= 360,
      "Loan term must be between 1 and 360 months"
    ),
  purpose: z.string().optional(),
  downPaymentPercent: z.string().optional(),
  propertyValue: z.string().optional(),
});

export const approveLoanSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comments: z.string().optional(),
  reviewerId: z.string().optional(),
});

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
export type ApproveLoanFormData = z.infer<typeof approveLoanSchema>;

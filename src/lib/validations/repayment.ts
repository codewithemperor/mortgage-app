import { z } from "zod";

export const repaymentSchema = z.object({
  loanId: z.string().min(1, "Loan is required"),
  amountPaid: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Amount must be a positive number"
    ),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CHEQUE", "ONLINE"]),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type RepaymentFormData = z.infer<typeof repaymentSchema>;

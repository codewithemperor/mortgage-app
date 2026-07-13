import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../../helpers";

export async function POST(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { loanId, amount, reference } = body;

    if (!loanId || !amount || !reference) {
      return apiResponse(null, "Loan ID, amount, and payment reference are required", 400);
    }

    // Verify the loan belongs to this borrower
    const loan = await prisma.loanApplication.findFirst({
      where: { id: loanId, borrowerId: borrower!.id },
    });

    if (!loan) {
      return apiResponse(null, "Mortgage not found", 404);
    }

    if (loan.status !== "DISBURSED") {
      return apiResponse(null, "Can only make payments on active (disbursed) mortgages", 400);
    }

    // Validate payment amount does not exceed remaining balance
    const unpaidSchedules = await prisma.amortizationSchedule.findMany({
      where: { loanId, status: "UNPAID" },
    });
    const remainingBalance = unpaidSchedules.reduce(
      (sum, entry) => sum + Number(entry.paymentAmount),
      0
    );

    if (parseFloat(amount) > remainingBalance) {
      return apiResponse(
        null,
        `Payment amount (₦${parseFloat(amount).toLocaleString()}) exceeds the remaining balance of ₦${remainingBalance.toLocaleString()}`,
        400
      );
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        borrowerId: borrower!.id,
        loanId,
        amount: parseFloat(amount),
        reference,
        status: "PENDING",
      },
    });

    return apiResponse(paymentRequest, "Payment request submitted successfully", 201);
  } catch (error) {
    console.error("Create payment request error:", error);
    return apiResponse(null, "Failed to submit payment request", 500);
  }
}

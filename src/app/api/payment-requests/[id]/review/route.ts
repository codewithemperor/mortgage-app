import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { PaymentStatus, PaymentRequestStatus } from "@/generated/prisma/client";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, comments, reviewerId } = body;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return apiResponse(null, "Action must be APPROVE or REJECT", 400);
    }

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            amortizationSchedule: {
              where: { status: PaymentStatus.UNPAID },
              orderBy: { installmentNo: "asc" },
            },
          },
        },
      },
    });

    if (!paymentRequest) {
      return apiResponse(null, "Payment request not found", 404);
    }

    if (paymentRequest.status !== "PENDING") {
      return apiResponse(null, "This payment request has already been reviewed", 400);
    }

    // Validate payment amount does not exceed remaining balance
    const remainingBalance = paymentRequest.loan.amortizationSchedule.reduce(
      (sum, entry) => sum + Number(entry.paymentAmount),
      0
    );

    if (Number(paymentRequest.amount) > remainingBalance) {
      return apiResponse(
        null,
        `Payment amount (₦${Number(paymentRequest.amount).toLocaleString()}) exceeds the remaining balance of ₦${remainingBalance.toLocaleString()}`,
        400
      );
    }

    if (action === "APPROVE") {
      const loan = paymentRequest.loan;
      const amountPaid = Number(paymentRequest.amount);
      const schedule = loan.amortizationSchedule;
      let remainingAmount = amountPaid;
      let totalPrincipalAllocated = 0;
      let totalInterestAllocated = 0;

      for (const entry of schedule) {
        if (remainingAmount <= 0) break;
        const entryDue = Number(entry.paymentAmount);
        const payThisEntry = Math.min(remainingAmount, entryDue);
        totalPrincipalAllocated += payThisEntry * (Number(entry.principalAmount) / entryDue);
        totalInterestAllocated += payThisEntry * (Number(entry.interestAmount) / entryDue);

        if (payThisEntry >= entryDue) {
          await prisma.amortizationSchedule.update({
            where: { id: entry.id },
            data: { status: PaymentStatus.PAID, paidDate: new Date() },
          });
        }

        remainingAmount -= payThisEntry;
      }

      // Create repayment record
      await prisma.repayment.create({
        data: {
          loanId: paymentRequest.loanId,
          amountPaid,
          principalAmount: Math.round(totalPrincipalAllocated * 100) / 100,
          interestAmount: Math.round(totalInterestAllocated * 100) / 100,
          paymentMethod: "BANK_TRANSFER",
          receiptNumber: paymentRequest.reference,
          notes: `Approved from payment request ${paymentRequest.id}`,
        },
      });

      // Check if all schedule entries are paid
      const unpaidCount = await prisma.amortizationSchedule.count({
        where: { loanId: paymentRequest.loanId, status: PaymentStatus.UNPAID },
      });

      if (unpaidCount === 0) {
        await prisma.loanApplication.update({
          where: { id: paymentRequest.loanId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }

      // Update overdue entries
      await prisma.amortizationSchedule.updateMany({
        where: {
          loanId: paymentRequest.loanId,
          status: PaymentStatus.UNPAID,
          dueDate: { lt: new Date() },
        },
        data: { status: PaymentStatus.OVERDUE },
      });
    }

    // Update the payment request status
    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: action === "APPROVE" ? PaymentRequestStatus.APPROVED : PaymentRequestStatus.REJECTED,
        reviewedBy: reviewerId || null,
        reviewedAt: new Date(),
        reviewComments: comments || null,
      },
      include: {
        borrower: { select: { firstName: true, lastName: true } },
        loan: { select: { id: true } },
      },
    });

    return apiResponse(updated, `Payment request ${action === "APPROVE" ? "approved" : "rejected"} successfully`);
  } catch (error) {
    console.error("Review payment request error:", error);
    return apiResponse(null, "Failed to review payment request", 500);
  }
}

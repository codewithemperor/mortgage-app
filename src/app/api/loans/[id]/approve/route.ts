import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { approveLoanSchema } from "@/lib/validations/loan";
import { LoanStatus, PaymentStatus } from "@/generated/prisma/client";
import { generateAmortizationSchedule } from "@/lib/amortization";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = approveLoanSchema.safeParse(body);

    if (!validated.success) {
      return apiResponse(null, validated.error.issues[0]?.message ?? "Validation failed", 400);
    }

    const loan = await prisma.loanApplication.findUnique({ where: { id } });

    if (!loan) {
      return apiResponse(null, "Loan not found", 404);
    }

    if (loan.status !== LoanStatus.PENDING && loan.status !== LoanStatus.UNDER_REVIEW) {
      return apiResponse(null, `Cannot ${validated.data.action.toLowerCase()} a loan with status ${loan.status}`, 400);
    }

    // Verify reviewer exists if reviewerId provided
    let reviewerId = validated.data.reviewerId || null;
    if (reviewerId) {
      const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } });
      if (!reviewer) {
        reviewerId = null;
      }
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: {
        status: validated.data.action === "APPROVE" ? LoanStatus.APPROVED : LoanStatus.DEFAULTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewComments: validated.data.comments || null,
        approvedAt: validated.data.action === "APPROVE" ? new Date() : null,
      },
    });

    // Generate amortization schedule on approval
    if (validated.data.action === "APPROVE") {
      const schedule = generateAmortizationSchedule({
        principal: Number(loan.loanAmount),
        annualRate: Number(loan.interestRate),
        termMonths: loan.loanTermMonths,
        startDate: new Date(),
      });

      await prisma.amortizationSchedule.createMany({
        data: schedule.map((entry) => ({
          loanId: id,
          installmentNo: entry.installmentNo,
          dueDate: entry.dueDate,
          paymentAmount: entry.paymentAmount,
          principalAmount: entry.principalAmount,
          interestAmount: entry.interestAmount,
          balanceAfter: entry.balanceAfter,
          status: PaymentStatus.UNPAID,
        })),
      });
    }

    return apiResponse(updated, `Loan ${validated.data.action === "APPROVE" ? "approved" : "rejected"} successfully`);
  } catch (error) {
    console.error("Approve loan error:", error);
    return apiResponse(null, "Failed to process loan action", 500);
  }
}

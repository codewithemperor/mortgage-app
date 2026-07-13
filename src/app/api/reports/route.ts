import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { LoanStatus } from "@/generated/prisma/client";

export async function GET() {
  try {
    const [
      totalLoans,
      totalDisbursed,
      totalCollected,
      totalOutstanding,
      loansByStatus,
      recentRepayments,
      borrowerOccupations,
      loanPurposeDistribution,
    ] = await Promise.all([
      prisma.loanApplication.count(),
      prisma.loanApplication.aggregate({
        where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.COMPLETED] } },
        _sum: { loanAmount: true },
      }),
      prisma.repayment.aggregate({ _sum: { amountPaid: true } }),
      // Outstanding = total disbursed - total collected
      prisma.loanApplication.aggregate({
        where: { status: LoanStatus.DISBURSED },
        _sum: { loanAmount: true },
      }),
      prisma.loanApplication.groupBy({
        by: ["status"],
        _count: true,
        _sum: { loanAmount: true },
      }),
      prisma.repayment.findMany({
        take: 20,
        orderBy: { paymentDate: "desc" },
        include: { loan: { select: { borrower: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.borrower.groupBy({
        by: ["occupation"],
        where: { occupation: { not: null } },
        _count: true,
      }),
      prisma.loanApplication.groupBy({
        by: ["purpose"],
        where: { purpose: { not: null } },
        _count: true,
      }),
    ]);

    const disbursed = Number(totalDisbursed._sum.loanAmount || 0);
    const collected = Number(totalCollected._sum.amountPaid || 0);
    const disbursedOutstanding = Number(totalOutstanding._sum.loanAmount || 0) - collected;

    return apiResponse({
      summary: {
        totalLoans,
        totalDisbursed: disbursed,
        totalCollected: collected,
        totalOutstanding: Math.max(0, disbursedOutstanding),
        collectionRate: disbursed > 0 ? (collected / disbursed) * 100 : 0,
      },
      loansByStatus,
      recentRepayments,
      borrowerOccupations,
      loanPurposeDistribution,
    });
  } catch (error) {
    console.error("Reports error:", error);
    return apiResponse(null, "Failed to generate reports", 500);
  }
}

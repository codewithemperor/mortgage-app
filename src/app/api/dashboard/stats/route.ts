import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { LoanStatus } from "@/generated/prisma/client";

export async function GET() {
  try {
    const [
      totalBorrowers,
      activeLoans,
      totalDisbursed,
      monthlyCollections,
      pendingApplications,
      overduePayments,
      loansByStatus,
      recentLoans,
    ] = await Promise.all([
      // Total borrowers
      prisma.borrower.count(),
      // Active loans (DISBURSED + APPROVED)
      prisma.loanApplication.count({
        where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.APPROVED] } },
      }),
      // Total disbursed amount
      prisma.loanApplication.aggregate({
        where: { status: { in: [LoanStatus.DISBURSED, LoanStatus.APPROVED, LoanStatus.COMPLETED] } },
        _sum: { loanAmount: true },
      }),
      // Monthly collections (repayments this month)
      prisma.repayment.aggregate({
        where: {
          paymentDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amountPaid: true },
      }),
      // Pending applications
      prisma.loanApplication.count({
        where: { status: { in: [LoanStatus.PENDING, LoanStatus.UNDER_REVIEW] } },
      }),
      // Overdue payments (unpaid schedules past due date)
      prisma.amortizationSchedule.count({
        where: {
          status: "UNPAID",
          dueDate: { lt: new Date() },
        },
      }),
      // Loan status distribution
      prisma.loanApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      // Recent 5 loan applications
      prisma.loanApplication.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          borrower: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const statusDistribution: Record<string, number> = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      DISBURSED: 0,
      COMPLETED: 0,
      DEFAULTED: 0,
    };

    for (const item of loansByStatus) {
      statusDistribution[item.status] = item._count.status;
    }

    return apiResponse({
      totalBorrowers,
      activeLoans,
      totalDisbursed: totalDisbursed._sum.loanAmount || 0,
      monthlyCollections: monthlyCollections._sum.amountPaid || 0,
      pendingApplications,
      overduePayments,
      loanStatusDistribution: statusDistribution,
      recentLoans,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return apiResponse(null, "Failed to fetch dashboard statistics", 500);
  }
}

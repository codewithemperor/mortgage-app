import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../helpers";
import { LoanStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const [
      totalLoans,
      activeLoans,
      totalBorrowed,
      totalPaid,
      nextPayments,
    ] = await Promise.all([
      prisma.loanApplication.count({
        where: { borrowerId: borrower!.id },
      }),
      prisma.loanApplication.count({
        where: {
          borrowerId: borrower!.id,
          status: { in: [LoanStatus.DISBURSED, LoanStatus.APPROVED] },
        },
      }),
      prisma.loanApplication.aggregate({
        where: { borrowerId: borrower!.id },
        _sum: { loanAmount: true },
      }),
      prisma.repayment.aggregate({
        where: { loan: { borrowerId: borrower!.id } },
        _sum: { amountPaid: true },
      }),
      prisma.amortizationSchedule.findMany({
        where: {
          loan: { borrowerId: borrower!.id },
          status: "UNPAID",
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 3,
        include: {
          loan: {
            select: { id: true, loanAmount: true },
          },
        },
      }),
    ]);

    return apiResponse({
      totalLoans,
      activeLoans,
      totalBorrowed: totalBorrowed._sum.loanAmount || 0,
      totalPaid: totalPaid._sum.amountPaid || 0,
      nextPayments,
    });
  } catch (error) {
    console.error("Borrower dashboard error:", error);
    return apiResponse(null, "Failed to fetch dashboard data", 500);
  }
}

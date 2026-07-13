import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { LoanStatus } from "@/generated/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loan = await prisma.loanApplication.findUnique({ where: { id } });

    if (!loan) {
      return apiResponse(null, "Loan not found", 404);
    }

    if (loan.status !== LoanStatus.APPROVED) {
      return apiResponse(null, "Only approved loans can be disbursed", 400);
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: {
        status: LoanStatus.DISBURSED,
        disbursedAt: new Date(),
      },
    });

    return apiResponse(updated, "Loan disbursed successfully");
  } catch (error) {
    console.error("Disburse loan error:", error);
    return apiResponse(null, "Failed to disburse loan", 500);
  }
}

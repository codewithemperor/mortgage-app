import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loan = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        borrower: true,
        property: true,
        reviewer: { select: { name: true, email: true, role: true } },
        repayments: { orderBy: { paymentDate: "desc" } },
        amortizationSchedule: { orderBy: { installmentNo: "asc" } },
      },
    });

    if (!loan) {
      return apiResponse(null, "Loan not found", 404);
    }

    return apiResponse(loan);
  } catch (error) {
    console.error("Fetch loan error:", error);
    return apiResponse(null, "Failed to fetch loan", 500);
  }
}

import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../../helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const { id } = await params;

    const loan = await prisma.loanApplication.findFirst({
      where: { id, borrowerId: borrower!.id },
      include: {
        property: true,
        amortizationSchedule: {
          orderBy: { installmentNo: "asc" },
        },
        repayments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!loan) {
      return apiResponse(null, "Loan not found", 404);
    }

    return apiResponse(loan);
  } catch (error) {
    console.error("Borrower loan detail error:", error);
    return apiResponse(null, "Failed to fetch loan detail", 500);
  }
}

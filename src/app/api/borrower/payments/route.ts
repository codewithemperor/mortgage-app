import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../helpers";

export async function GET(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const repayments = await prisma.repayment.findMany({
      where: { loan: { borrowerId: borrower!.id } },
      include: {
        loan: {
          select: { id: true, loanAmount: true, property: { select: { title: true } } },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const schedule = await prisma.amortizationSchedule.findMany({
      where: { loan: { borrowerId: borrower!.id } },
      include: {
        loan: {
          select: { id: true, loanAmount: true },
        },
      },
      orderBy: [{ loanId: "asc" }, { installmentNo: "asc" }],
    });

    return apiResponse({ repayments, schedule });
  } catch (error) {
    console.error("Borrower payments error:", error);
    return apiResponse(null, "Failed to fetch payments", 500);
  }
}

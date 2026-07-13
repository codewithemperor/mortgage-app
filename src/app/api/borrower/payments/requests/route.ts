import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../../helpers";

export async function GET(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const requests = await prisma.paymentRequest.findMany({
      where: { borrowerId: borrower!.id },
      include: {
        loan: {
          select: {
            id: true,
            loanAmount: true,
            property: { select: { title: true } },
          },
        },
        reviewer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(requests);
  } catch (error) {
    console.error("Fetch borrower payment requests error:", error);
    return apiResponse(null, "Failed to fetch payment requests", 500);
  }
}

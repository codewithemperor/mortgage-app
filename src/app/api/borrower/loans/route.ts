import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../helpers";

export async function GET(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const loans = await prisma.loanApplication.findMany({
      where: { borrowerId: borrower!.id },
      include: {
        property: {
          select: { title: true, type: true, address: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(loans);
  } catch (error) {
    console.error("Borrower loans error:", error);
    return apiResponse(null, "Failed to fetch loans", 500);
  }
}

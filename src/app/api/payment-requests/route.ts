import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        include: {
          borrower: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          loan: {
            select: {
              id: true,
              loanAmount: true,
              status: true,
              property: { select: { title: true } },
            },
          },
          reviewer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.paymentRequest.count({ where }),
    ]);

    return apiResponse({
      data: requests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Fetch payment requests error:", error);
    return apiResponse(null, "Failed to fetch payment requests", 500);
  }
}

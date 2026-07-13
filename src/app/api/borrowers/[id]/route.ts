import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { borrowerSchema } from "@/lib/validations/borrower";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const borrower = await prisma.borrower.findUnique({
      where: { id },
      include: {
        _count: { select: { loans: true } },
        loans: {
          include: {
            property: { select: { title: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!borrower) {
      return apiResponse(null, "Borrower not found", 404);
    }

    return apiResponse(borrower);
  } catch (error) {
    console.error("Fetch borrower error:", error);
    return apiResponse(null, "Failed to fetch borrower", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = borrowerSchema.safeParse(body);

    if (!validated.success) {
      return apiResponse(null, validated.error.issues[0]?.message ?? "Validation failed", 400);
    }

    const borrower = await prisma.borrower.update({
      where: { id },
      data: {
        ...validated.data,
        monthlyIncome: parseFloat(validated.data.monthlyIncome),
        nin: validated.data.nin || null,
        occupation: validated.data.occupation || null,
        employer: validated.data.employer || null,
      },
    });

    return apiResponse(borrower, "Borrower updated successfully");
  } catch (error: any) {
    if (error.code === "P2025") {
      return apiResponse(null, "Borrower not found", 404);
    }
    console.error("Update borrower error:", error);
    return apiResponse(null, "Failed to update borrower", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.borrower.delete({ where: { id } });
    return apiResponse(null, "Borrower deleted successfully");
  } catch (error: any) {
    if (error.code === "P2025") {
      return apiResponse(null, "Borrower not found", 404);
    }
    console.error("Delete borrower error:", error);
    return apiResponse(null, "Failed to delete borrower", 500);
  }
}

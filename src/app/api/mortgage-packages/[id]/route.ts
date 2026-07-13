import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pkg = await prisma.mortgagePackage.findUnique({
      where: { id },
      include: { _count: { select: { loans: true } } },
    });

    if (!pkg) {
      return apiResponse(null, "Mortgage package not found", 404);
    }

    return apiResponse(pkg);
  } catch (error) {
    console.error("Fetch mortgage package error:", error);
    return apiResponse(null, "Failed to fetch mortgage package", 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const pkg = await prisma.mortgagePackage.findUnique({ where: { id } });
    if (!pkg) {
      return apiResponse(null, "Mortgage package not found", 404);
    }

    const updated = await prisma.mortgagePackage.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.interestRate !== undefined && { interestRate: parseFloat(body.interestRate) }),
        ...(body.maxAmount !== undefined && { maxAmount: parseFloat(body.maxAmount) }),
        ...(body.minDownPayment !== undefined && { minDownPayment: parseInt(body.minDownPayment) }),
        ...(body.defaultTermMonths !== undefined && { defaultTermMonths: parseInt(body.defaultTermMonths) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return apiResponse(updated, "Mortgage package updated successfully");
  } catch (error) {
    console.error("Update mortgage package error:", error);
    return apiResponse(null, "Failed to update mortgage package", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pkg = await prisma.mortgagePackage.findUnique({ where: { id } });
    if (!pkg) {
      return apiResponse(null, "Mortgage package not found", 404);
    }

    // Check if any loans use this package
    const loanCount = await prisma.loanApplication.count({ where: { packageId: id } });
    if (loanCount > 0) {
      return apiResponse(null, "Cannot delete package: it has linked mortgage applications. Deactivate it instead.", 400);
    }

    await prisma.mortgagePackage.delete({ where: { id } });
    return apiResponse(null, "Mortgage package deleted successfully");
  } catch (error) {
    console.error("Delete mortgage package error:", error);
    return apiResponse(null, "Failed to delete mortgage package", 500);
  }
}

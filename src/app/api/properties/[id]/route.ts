import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return apiResponse(null, "Property not found", 404);
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.currentValue !== undefined && { currentValue: parseFloat(body.currentValue) }),
        ...(body.documents !== undefined && { documents: body.documents }),
      },
    });

    return apiResponse(updated, "Property updated successfully");
  } catch (error) {
    console.error("Update property error:", error);
    return apiResponse(null, "Failed to update property", 500);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return apiResponse(null, "Property not found", 404);
    }

    const loanCount = await prisma.loanApplication.count({ where: { propertyId: id } });
    if (loanCount > 0) {
      return apiResponse(null, "Cannot delete property: it has linked mortgage applications", 400);
    }

    await prisma.property.delete({ where: { id } });
    return apiResponse(null, "Property deleted successfully");
  } catch (error) {
    console.error("Delete property error:", error);
    return apiResponse(null, "Failed to delete property", 500);
  }
}

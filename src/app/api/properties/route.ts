import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
    });
    return apiResponse(properties);
  } catch (error) {
    console.error("Fetch properties error:", error);
    return apiResponse(null, "Failed to fetch properties", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, address, type, currentValue } = body;

    if (!title || !address || !type || !currentValue) {
      return apiResponse(null, "Missing required fields", 400);
    }

    const property = await prisma.property.create({
      data: {
        title,
        address,
        type,
        currentValue: parseFloat(currentValue),
      },
    });

    return apiResponse(property, "Property created successfully", 201);
  } catch (error) {
    console.error("Create property error:", error);
    return apiResponse(null, "Failed to create property", 500);
  }
}

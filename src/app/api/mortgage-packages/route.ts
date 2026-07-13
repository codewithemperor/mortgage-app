import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showInactive = searchParams.get("all") === "true";

    const packages = await prisma.mortgagePackage.findMany({
      where: showInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(packages);
  } catch (error) {
    console.error("Fetch mortgage packages error:", error);
    return apiResponse(null, "Failed to fetch mortgage packages", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, interestRate, maxAmount, minDownPayment, defaultTermMonths } = body;

    if (!name || !interestRate || !maxAmount || !minDownPayment || !defaultTermMonths) {
      return apiResponse(null, "Missing required fields", 400);
    }

    const pkg = await prisma.mortgagePackage.create({
      data: {
        name,
        description: description || null,
        interestRate: parseFloat(interestRate),
        maxAmount: parseFloat(maxAmount),
        minDownPayment: parseInt(minDownPayment),
        defaultTermMonths: parseInt(defaultTermMonths),
      },
    });

    return apiResponse(pkg, "Mortgage package created successfully", 201);
  } catch (error) {
    console.error("Create mortgage package error:", error);
    return apiResponse(null, "Failed to create mortgage package", 500);
  }
}

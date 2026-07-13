import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { borrowerSchema } from "@/lib/validations/borrower";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { nin: { contains: search } },
          ],
        }
      : {};

    const [borrowers, total] = await Promise.all([
      prisma.borrower.findMany({
        where,
        include: { _count: { select: { loans: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.borrower.count({ where }),
    ]);

    return apiResponse({
      data: borrowers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Fetch borrowers error:", error);
    return apiResponse(null, "Failed to fetch borrowers", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = borrowerSchema.safeParse(body);

    if (!validated.success) {
      return apiResponse(null, validated.error.issues[0]?.message ?? "Validation failed", 400);
    }

    const existing = await prisma.borrower.findUnique({
      where: { email: validated.data.email },
    });

    if (existing) {
      return apiResponse(null, "A borrower with this email already exists", 409);
    }

    // Default password is the borrower's phone number
    const defaultPassword = validated.data.phone || validated.data.email;
    const hashedPassword = validated.data.password
      ? await bcrypt.hash(validated.data.password, 10)
      : await bcrypt.hash(defaultPassword, 10);

    const borrower = await prisma.borrower.create({
      data: {
        ...validated.data,
        password: hashedPassword,
        monthlyIncome: parseFloat(validated.data.monthlyIncome),
        nin: validated.data.nin || null,
        occupation: validated.data.occupation || null,
        employer: validated.data.employer || null,
      },
    });

    return apiResponse(borrower, "Borrower created successfully", 201);
  } catch (error) {
    console.error("Create borrower error:", error);
    return apiResponse(null, "Failed to create borrower", 500);
  }
}

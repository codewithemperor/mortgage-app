import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { reviewedLoans: true, auditLogs: true } },
      },
    });

    return apiResponse(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    return apiResponse(null, "Failed to fetch users", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, role, isActive, name } = body;

    if (!id) {
      return apiResponse(null, "User ID is required", 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return apiResponse(null, "User not found", 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role: role as Role }),
        ...(isActive !== undefined && { isActive }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiResponse(updated, "User updated successfully");
  } catch (error) {
    console.error("Update user error:", error);
    return apiResponse(null, "Failed to update user", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, role, password } = body;

    if (!email || !name) {
      return apiResponse(null, "Email and name are required", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiResponse(null, "A user with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password || "password123", 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: (role || "LOAN_OFFICER") as Role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiResponse(user, "User created successfully", 201);
  } catch (error) {
    console.error("Create user error:", error);
    return apiResponse(null, "Failed to create user", 500);
  }
}

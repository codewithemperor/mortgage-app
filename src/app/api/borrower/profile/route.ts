import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { getBorrowerFromRequest } from "../helpers";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const profile = await prisma.borrower.findUnique({
      where: { id: borrower!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        nin: true,
        occupation: true,
        employer: true,
        monthlyIncome: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return apiResponse(null, "Profile not found", 404);
    }

    return apiResponse(profile);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return apiResponse(null, "Failed to fetch profile", 500);
  }
}

export async function PUT(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { phone, address, occupation, employer } = body;

    const updated = await prisma.borrower.update({
      where: { id: borrower!.id },
      data: {
        ...(phone && { phone }),
        ...(address && { address }),
        ...(occupation !== undefined && { occupation }),
        ...(employer !== undefined && { employer }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        nin: true,
        occupation: true,
        employer: true,
        monthlyIncome: true,
        createdAt: true,
      },
    });

    return apiResponse(updated, "Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    return apiResponse(null, "Failed to update profile", 500);
  }
}

export async function POST(request: Request) {
  const { borrower, response: authResponse } = await getBorrowerFromRequest(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiResponse(null, "Current and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return apiResponse(null, "New password must be at least 6 characters", 400);
    }

    const record = await prisma.borrower.findUnique({
      where: { id: borrower!.id },
      select: { password: true },
    });

    if (!record) {
      return apiResponse(null, "Borrower not found", 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, record.password);
    if (!isMatch) {
      return apiResponse(null, "Current password is incorrect", 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.borrower.update({
      where: { id: borrower!.id },
      data: { password: hashedPassword },
    });

    return apiResponse(null, "Password changed successfully");
  } catch (error) {
    console.error("Change password error:", error);
    return apiResponse(null, "Failed to change password", 500);
  }
}

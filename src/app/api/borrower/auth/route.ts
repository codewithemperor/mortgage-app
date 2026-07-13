import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { signBorrowerToken, verifyBorrowerToken, COOKIE_NAME } from "@/lib/portal-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiResponse(null, "Email and password are required", 400);
    }

    const borrower = await prisma.borrower.findUnique({
      where: { email: email as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
      },
    });

    if (!borrower) {
      return apiResponse(null, "Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(password as string, borrower.password);
    if (!isValid) {
      return apiResponse(null, "Invalid email or password", 401);
    }

    const token = await signBorrowerToken({
      id: borrower.id,
      email: borrower.email,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
    });

    const { data, success, error, message } = await apiResponse(
      {
        id: borrower.id,
        email: borrower.email,
        firstName: borrower.firstName,
        lastName: borrower.lastName,
      },
      "Login successful"
    ).json();

    return Response.json(
      { success, data, error, message },
      {
        headers: {
          "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error("Borrower login error:", error);
    return apiResponse(null, "Login failed", 500);
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers
      .get("Cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1];

    if (!token) {
      return apiResponse(null, "Not authenticated", 401);
    }

    const payload = await verifyBorrowerToken(token);
    if (!payload) {
      return apiResponse(null, "Session expired", 401);
    }

    const borrower = await prisma.borrower.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        nin: true,
        occupation: true,
        employer: true,
        monthlyIncome: true,
        createdAt: true,
      },
    });

    if (!borrower) {
      return apiResponse(null, "Borrower not found", 404);
    }

    return apiResponse(borrower);
  } catch (error) {
    console.error("Session check error:", error);
    return apiResponse(null, "Session check failed", 500);
  }
}

export async function DELETE() {
  return new Response(null, {
    status: 200,
    headers: {
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    },
  });
}

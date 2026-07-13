import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { loanApplicationSchema } from "@/lib/validations/loan";
import { LoanStatus } from "@/generated/prisma/client";
import { generateAmortizationSchedule, calculateMonthlyPayment, calculateTotalPayable } from "@/lib/amortization";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { borrower: { firstName: { contains: search, mode: "insensitive" } } },
        { borrower: { lastName: { contains: search, mode: "insensitive" } } },
        { borrower: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        include: {
          borrower: { select: { firstName: true, lastName: true, email: true } },
          property: { select: { title: true, type: true } },
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loanApplication.count({ where }),
    ]);

    return apiResponse({
      data: loans,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Fetch loans error:", error);
    return apiResponse(null, "Failed to fetch loans", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loanApplicationSchema.safeParse(body);

    if (!validated.success) {
      return apiResponse(null, validated.error.issues[0]?.message ?? "Validation failed", 400);
    }

    const loanAmount = parseFloat(validated.data.loanAmount);
    const interestRate = parseFloat(validated.data.interestRate);
    const termMonths = parseInt(validated.data.loanTermMonths);

    const monthlyPayment = calculateMonthlyPayment({ principal: loanAmount, annualRate: interestRate, termMonths: termMonths });
    const totalPayable = calculateTotalPayable({ principal: loanAmount, annualRate: interestRate, termMonths: termMonths });

    const loan = await prisma.loanApplication.create({
      data: {
        borrowerId: validated.data.borrowerId,
        propertyId: validated.data.propertyId || null,
        packageId: validated.data.packageId || null,
        loanAmount,
        interestRate,
        loanTermMonths: termMonths,
        monthlyPayment,
        totalPayable,
        downPaymentPercent: validated.data.downPaymentPercent ? parseFloat(validated.data.downPaymentPercent) : null,
        propertyValue: validated.data.propertyValue ? parseFloat(validated.data.propertyValue) : null,
        purpose: validated.data.purpose || null,
        status: LoanStatus.PENDING,
      },
    });

    return apiResponse(loan, "Loan application created successfully", 201);
  } catch (error) {
    console.error("Create loan error:", error);
    return apiResponse(null, "Failed to create loan application", 500);
  }
}

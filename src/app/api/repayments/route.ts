import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/utils";
import { repaymentSchema } from "@/lib/validations/repayment";
import { PaymentStatus, PaymentMethod } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const loanId = searchParams.get("loanId") || "";

    const where: any = {};
    if (loanId) where.loanId = loanId;

    const [repayments, total] = await Promise.all([
      prisma.repayment.findMany({
        where,
        include: {
          loan: {
            select: {
              id: true,
              borrower: { select: { firstName: true, lastName: true } },
              status: true,
            },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.repayment.count({ where }),
    ]);

    return apiResponse({
      data: repayments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Fetch repayments error:", error);
    return apiResponse(null, "Failed to fetch repayments", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = repaymentSchema.safeParse(body);

    if (!validated.success) {
      return apiResponse(null, validated.error.issues[0]?.message ?? "Validation failed", 400);
    }

    const loanId = validated.data.loanId;
    const amountPaid = parseFloat(validated.data.amountPaid);

    // Fetch the loan
    const loan = await prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: { amortizationSchedule: { where: { status: PaymentStatus.UNPAID }, orderBy: { installmentNo: "asc" } } },
    });

    if (!loan) {
      return apiResponse(null, "Loan not found", 404);
    }

    if (loan.status !== "DISBURSED") {
      return apiResponse(null, "Can only record payments for disbursed loans", 400);
    }

    // Allocate payment to amortization schedule entries
    const schedule = loan.amortizationSchedule;
    let remainingAmount = amountPaid;
    let totalPrincipalAllocated = 0;
    let totalInterestAllocated = 0;

    for (const entry of schedule) {
      if (remainingAmount <= 0) break;

      const entryDue = Number(entry.paymentAmount);
      const payThisEntry = Math.min(remainingAmount, entryDue);

      totalPrincipalAllocated += payThisEntry * (Number(entry.principalAmount) / entryDue);
      totalInterestAllocated += payThisEntry * (Number(entry.interestAmount) / entryDue);

      if (payThisEntry >= entryDue) {
        await prisma.amortizationSchedule.update({
          where: { id: entry.id },
          data: { status: PaymentStatus.PAID, paidDate: new Date() },
        });
      } else {
        // Partial payment - keep as unpaid
        await prisma.amortizationSchedule.update({
          where: { id: entry.id },
          data: { paidDate: new Date() },
        });
      }

      remainingAmount -= payThisEntry;
    }

    // Check if all schedule entries are paid
    const unpaidCount = await prisma.amortizationSchedule.count({
      where: { loanId, status: PaymentStatus.UNPAID },
    });

    // Create repayment record
    const repayment = await prisma.repayment.create({
      data: {
        loanId,
        amountPaid,
        principalAmount: Math.round(totalPrincipalAllocated * 100) / 100,
        interestAmount: Math.round(totalInterestAllocated * 100) / 100,
        paymentMethod: validated.data.paymentMethod as PaymentMethod,
        receiptNumber: validated.data.receiptNumber || undefined,
        notes: validated.data.notes || undefined,
      },
    });

    // If all paid, mark loan as completed
    if (unpaidCount === 0) {
      await prisma.loanApplication.update({
        where: { id: loanId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    // Update overdue payments
    await prisma.amortizationSchedule.updateMany({
      where: {
        loanId,
        status: PaymentStatus.UNPAID,
        dueDate: { lt: new Date() },
      },
      data: { status: PaymentStatus.OVERDUE },
    });

    return apiResponse(repayment, "Payment recorded successfully", 201);
  } catch (error) {
    console.error("Record repayment error:", error);
    return apiResponse(null, "Failed to record payment", 500);
  }
}

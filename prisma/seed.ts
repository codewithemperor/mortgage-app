import { PrismaClient, Role, LoanStatus, PaymentStatus, PaymentMethod, PaymentRequestStatus } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data (in order of dependencies)
  await prisma.auditLog.deleteMany();
  await prisma.amortizationSchedule.deleteMany();
  await prisma.repayment.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.mortgagePackage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.borrower.deleteMany();
  await prisma.user.deleteMany();

  // Create Users (Staff)
  const staffPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@mortgagepro.com",
      name: "System Admin",
      password: staffPassword,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@mortgagepro.com",
      name: "Sarah Johnson",
      password: staffPassword,
      role: Role.MANAGER,
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: "officer@mortgagepro.com",
      name: "Michael Chen",
      password: staffPassword,
      role: Role.LOAN_OFFICER,
    },
  });

  console.log("✅ Created 3 staff users");

  // Create Borrowers — password is their phone number
  const borrowers = await Promise.all([
    prisma.borrower.create({
      data: {
        firstName: "James",
        lastName: "Okonkwo",
        email: "james.okonkwo@email.com",
        password: await bcrypt.hash("+2348012345678", 10),
        phone: "+2348012345678",
        address: "12 Admiralty Way, Lekki, Lagos",
        nin: "12345678901",
        occupation: "Software Engineer",
        employer: "TechCorp Nigeria",
        monthlyIncome: 850000,
      },
    }),
    prisma.borrower.create({
      data: {
        firstName: "Amina",
        lastName: "Bello",
        email: "amina.bello@email.com",
        password: await bcrypt.hash("+2348023456789", 10),
        phone: "+2348023456789",
        address: "5 Bank Road, Kaduna",
        nin: "23456789012",
        occupation: "Medical Doctor",
        employer: "Kaduna General Hospital",
        monthlyIncome: 1200000,
      },
    }),
    prisma.borrower.create({
      data: {
        firstName: "Chidi",
        lastName: "Nwosu",
        email: "chidi.nwosu@email.com",
        password: await bcrypt.hash("+2348034567890", 10),
        phone: "+2348034567890",
        address: "22 Ogui Road, Enugu",
        nin: "34567890123",
        occupation: "Business Owner",
        employer: "Nwosu Enterprises",
        monthlyIncome: 600000,
      },
    }),
    prisma.borrower.create({
      data: {
        firstName: "Funke",
        lastName: "Adesanya",
        email: "funke.adesanya@email.com",
        password: await bcrypt.hash("+2348045678901", 10),
        phone: "+2348045678901",
        address: "8 Allen Avenue, Ikeja, Lagos",
        nin: "45678901234",
        occupation: "Accountant",
        employer: "Deloitte Nigeria",
        monthlyIncome: 950000,
      },
    }),
    prisma.borrower.create({
      data: {
        firstName: "Ibrahim",
        lastName: "Yusuf",
        email: "ibrahim.yusuf@email.com",
        password: await bcrypt.hash("+2348056789012", 10),
        phone: "+2348056789012",
        address: "15 Maiduguri Road, Kano",
        nin: "56789012345",
        occupation: "Civil Servant",
        employer: "Federal Ministry of Education",
        monthlyIncome: 450000,
      },
    }),
  ]);

  console.log("✅ Created 5 borrowers (password = phone number)");

  // Create Mortgage Packages
  const packages = await Promise.all([
    prisma.mortgagePackage.create({
      data: {
        name: "Home Starter Plan",
        description: "Affordable mortgage for first-time home buyers with competitive rates.",
        interestRate: 15.0,
        maxAmount: 30000000,
        minDownPayment: 20,
        defaultTermMonths: 240,
        isActive: true,
      },
    }),
    prisma.mortgagePackage.create({
      data: {
        name: "Premium Home Plan",
        description: "Premium mortgage for high-value properties with flexible terms.",
        interestRate: 12.5,
        maxAmount: 100000000,
        minDownPayment: 30,
        defaultTermMonths: 300,
        isActive: true,
      },
    }),
    prisma.mortgagePackage.create({
      data: {
        name: "Quick Mortgage",
        description: "Short-term mortgage for smaller amounts, quick processing.",
        interestRate: 18.0,
        maxAmount: 15000000,
        minDownPayment: 15,
        defaultTermMonths: 60,
        isActive: true,
      },
    }),
  ]);

  console.log("✅ Created 3 mortgage packages");

  // Create Properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: "3-Bedroom Apartment at Lekki Phase 1",
        address: "45 Admiralty Way, Lekki Phase 1, Lagos",
        type: "Apartment",
        currentValue: 45000000,
      },
    }),
    prisma.property.create({
      data: {
        title: "4-Bedroom Duplex at Maitama",
        address: "3 Aso Drive, Maitama, Abuja",
        type: "Detached House",
        currentValue: 85000000,
      },
    }),
    prisma.property.create({
      data: {
        title: "2-Bedroom Flat at GRA Enugu",
        address: "10 Ogui Road, GRA, Enugu",
        type: "Apartment",
        currentValue: 28000000,
      },
    }),
  ]);

  console.log("✅ Created 3 properties");

  // Create Loan Applications
  // Note: loanAmount = propertyValue - (downPayment% × propertyValue)
  // The down payment is made by the borrower before disbursement
  const loans = await Promise.all([
    // Loan 1: Property 0 (45M) + Package 0 (20% down, 15%, 240mo)
    // Down payment: 45M × 20% = 9M → Loan: 36M
    prisma.loanApplication.create({
      data: {
        borrowerId: borrowers[0].id,
        propertyId: properties[0].id,
        packageId: packages[0].id,
        loanAmount: 36000000,
        interestRate: 15.0,
        loanTermMonths: 240,
        monthlyPayment: 474044.25,
        totalPayable: 113770620.00,
        downPaymentPercent: 20,
        propertyValue: 45000000,
        purpose: "Home purchase",
        status: LoanStatus.DISBURSED,
        reviewedBy: manager.id,
        reviewedAt: new Date("2026-01-15"),
        approvedAt: new Date("2026-01-20"),
        disbursedAt: new Date("2026-02-01"),
      },
    }),
    // Loan 2: Property 1 (85M) + Package 1 (30% down, 12.5%, 300mo)
    // Down payment: 85M × 30% = 25.5M → Loan: 59.5M
    prisma.loanApplication.create({
      data: {
        borrowerId: borrowers[1].id,
        propertyId: properties[1].id,
        packageId: packages[1].id,
        loanAmount: 59500000,
        interestRate: 12.5,
        loanTermMonths: 300,
        monthlyPayment: 648760.71,
        totalPayable: 194628213.00,
        downPaymentPercent: 30,
        propertyValue: 85000000,
        purpose: "Home purchase",
        status: LoanStatus.APPROVED,
        reviewedBy: manager.id,
        reviewedAt: new Date("2026-03-10"),
        approvedAt: new Date("2026-03-15"),
      },
    }),
    // Loan 3: Property 2 (28M) + Package 0 (20% down, 18%, 180mo)
    // Down payment: 28M × 20% = 5.6M → Loan: 22.4M
    prisma.loanApplication.create({
      data: {
        borrowerId: borrowers[2].id,
        propertyId: properties[2].id,
        packageId: packages[0].id,
        loanAmount: 22400000,
        interestRate: 18.0,
        loanTermMonths: 180,
        monthlyPayment: 360734.31,
        totalPayable: 64932175.80,
        downPaymentPercent: 20,
        propertyValue: 28000000,
        purpose: "Property development",
        status: LoanStatus.PENDING,
      },
    }),
    // Loan 4: No property, no package — manual entry
    prisma.loanApplication.create({
      data: {
        borrowerId: borrowers[3].id,
        loanAmount: 25000000,
        interestRate: 14.0,
        loanTermMonths: 120,
        monthlyPayment: 388166.09,
        totalPayable: 46579930.80,
        purpose: "Home renovation",
        status: LoanStatus.UNDER_REVIEW,
        reviewedBy: officer.id,
        reviewedAt: new Date("2026-06-01"),
      },
    }),
    // Loan 5: No property, no package — legacy completed loan
    prisma.loanApplication.create({
      data: {
        borrowerId: borrowers[4].id,
        loanAmount: 15000000,
        interestRate: 16.0,
        loanTermMonths: 60,
        monthlyPayment: 364770.86,
        totalPayable: 21886251.60,
        purpose: "Land purchase",
        status: LoanStatus.COMPLETED,
        reviewedBy: manager.id,
        reviewedAt: new Date("2025-06-01"),
        approvedAt: new Date("2025-06-10"),
        disbursedAt: new Date("2025-06-15"),
        completedAt: new Date("2026-06-01"),
      },
    }),
  ]);

  console.log("✅ Created 5 loan applications");

  // Create Repayments for the disbursed loan (loans[0])
  // Loan 1: 36M at 15% over 240mo → monthly ₦474,044.25
  const disbursedLoan = loans[0];
  const disbursedMonthly = 474044.25;
  const disbursedPrincipal = 36000000;
  const disbursedRate = 15.0;
  const disbursedMonthlyRate = disbursedRate / 100 / 12;
  const startDate = new Date(disbursedLoan.disbursedAt!);

  // Generate amortization using proper reducing balance formula
  let disbursedBalance = disbursedPrincipal;
  for (let i = 1; i <= 5; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const interestPayment = disbursedBalance * disbursedMonthlyRate;
    const principalPayment = disbursedMonthly - interestPayment;
    disbursedBalance = Math.max(0, disbursedBalance - principalPayment);

    await prisma.amortizationSchedule.create({
      data: {
        loanId: disbursedLoan.id,
        installmentNo: i,
        dueDate,
        paymentAmount: disbursedMonthly,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        balanceAfter: Math.round(disbursedBalance * 100) / 100,
        status: i <= 4 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        paidDate: i <= 4 ? new Date(dueDate.getTime() + 86400000 * 5) : null,
      },
    });

    if (i <= 4) {
      await prisma.repayment.create({
        data: {
          loanId: disbursedLoan.id,
          amountPaid: disbursedMonthly,
          principalAmount: Math.round(principalPayment * 100) / 100,
          interestAmount: Math.round(interestPayment * 100) / 100,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentDate: new Date(dueDate.getTime() + 86400000 * 5),
          receiptNumber: `RCP-${disbursedLoan.id.substring(0, 8)}-${i}`,
        },
      });
    }
  }

  console.log("✅ Created amortization schedule and repayments for Loan 1");

  // Create amortization schedule for Loan 2 (APPROVED loan) — borrower[1]
  // Loan 2: 59.5M at 12.5% over 300mo → monthly ₦648,760.71
  const approvedLoan = loans[1];
  const approvedMonthly = 648760.71;
  const approvedPrincipal = 59500000;
  const approvedRate = 12.5;
  const approvedMonthlyRate = approvedRate / 100 / 12;
  const approvedStartDate = new Date("2026-04-01"); // first due after approval

  let approvedBalance = approvedPrincipal;
  for (let i = 1; i <= 3; i++) {
    const dueDate = new Date(approvedStartDate);
    dueDate.setMonth(dueDate.getMonth() + i - 1);

    const interestPayment = approvedBalance * approvedMonthlyRate;
    const principalPayment = approvedMonthly - interestPayment;
    approvedBalance = Math.max(0, approvedBalance - principalPayment);

    await prisma.amortizationSchedule.create({
      data: {
        loanId: approvedLoan.id,
        installmentNo: i,
        dueDate,
        paymentAmount: approvedMonthly,
        principalAmount: Math.round(principalPayment * 100) / 100,
        interestAmount: Math.round(interestPayment * 100) / 100,
        balanceAfter: Math.round(approvedBalance * 100) / 100,
        status: i <= 1 ? PaymentStatus.PAID : PaymentStatus.UNPAID,
        paidDate: i <= 1 ? new Date("2026-07-10") : null,
      },
    });
  }

  // Create repayment for the approved payment request (Loan 2, installment 1)
  const approvedInt1 = approvedPrincipal * approvedMonthlyRate;
  const approvedPrin1 = approvedMonthly - approvedInt1;
  await prisma.repayment.create({
    data: {
      loanId: approvedLoan.id,
      amountPaid: approvedMonthly,
      principalAmount: Math.round(approvedPrin1 * 100) / 100,
      interestAmount: Math.round(approvedInt1 * 100) / 100,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date("2026-07-10"),
      receiptNumber: `RCP-${approvedLoan.id.substring(0, 8)}-1`,
    },
  });

  console.log("✅ Created amortization schedule and repayment for Loan 2 (from approved payment request)");

  // Create sample payment requests
  await prisma.paymentRequest.createMany({
    data: [
      {
        borrowerId: borrowers[0].id,
        loanId: loans[0].id,
        amount: 474044.25,
        reference: "TXN-20260713-001",
        status: PaymentRequestStatus.PENDING,
        createdAt: new Date(),
      },
      {
        borrowerId: borrowers[1].id,
        loanId: loans[1].id,
        amount: 648760.71,
        reference: "TXN-20260710-042",
        status: PaymentRequestStatus.APPROVED,
        reviewedBy: manager.id,
        reviewedAt: new Date("2026-07-10"),
        createdAt: new Date("2026-07-09"),
      },
      {
        borrowerId: borrowers[0].id,
        loanId: loans[0].id,
        amount: 200000,
        reference: "TXN-20260701-003",
        status: PaymentRequestStatus.REJECTED,
        reviewedBy: officer.id,
        reviewedAt: new Date("2026-07-02"),
        reviewComments: "Amount does not match monthly due payment",
        createdAt: new Date("2026-07-01"),
      },
    ],
  });

  console.log("✅ Created 3 sample payment requests");

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: officer.id,
        action: "CREATE",
        entity: "LoanApplication",
        entityId: loans[2].id,
        details: JSON.stringify({ borrowerId: borrowers[2].id, amount: 20000000 }),
      },
      {
        userId: manager.id,
        action: "APPROVE",
        entity: "LoanApplication",
        entityId: loans[1].id,
        details: JSON.stringify({ status: "APPROVED", comments: "All documents verified" }),
      },
      {
        userId: admin.id,
        action: "LOGIN",
        entity: "User",
        entityId: admin.id,
      },
    ],
  });

  console.log("✅ Created audit logs");
  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("Test Accounts:");
  console.log("  Admin:     admin@mortgagepro.com / password123");
  console.log("  Manager:   manager@mortgagepro.com / password123");
  console.log("  Officer:   officer@mortgagepro.com / password123");
  console.log("");
  console.log("  Borrowers (password = phone number):");
  console.log("    james.okonkwo@email.com / +2348012345678");
  console.log("    amina.bello@email.com / +2348023456789");
  console.log("    chidi.nwosu@email.com / +2348034567890");
  console.log("    funke.adesanya@email.com / +2348045678901");
  console.log("    ibrahim.yusuf@email.com / +2348056789012");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

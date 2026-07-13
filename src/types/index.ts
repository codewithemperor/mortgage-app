import { Role, LoanStatus, PaymentStatus, PaymentMethod, AuditAction } from "@/generated/prisma/client";

// Re-export Prisma enums for convenience
export type { Role, LoanStatus, PaymentStatus, PaymentMethod, AuditAction };

// User-related types
export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
};

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalBorrowers: number;
  activeLoans: number;
  totalDisbursed: number;
  monthlyCollections: number;
  pendingApplications: number;
  overduePayments: number;
  loanStatusDistribution: Record<string, number>;
  recentLoans: Array<{
    id: string;
    loanAmount: number;
    status: string;
    createdAt: Date;
    borrower: { firstName: string; lastName: string; email: string };
  }>;
}

// Borrower with loan count
export interface BorrowerWithLoanCount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  nin: string | null;
  occupation: string | null;
  employer: string | null;
  monthlyIncome: number;
  createdAt: Date;
  _count: { loans: number };
}

// Loan with borrower and property
export interface LoanWithRelations {
  id: string;
  borrowerId: string;
  propertyId: string | null;
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  purpose: string | null;
  status: LoanStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewComments: string | null;
  approvedAt: Date | null;
  disbursedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  borrower: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
    type: string;
    currentValue: number;
  } | null;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

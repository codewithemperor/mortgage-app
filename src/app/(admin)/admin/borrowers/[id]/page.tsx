"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Button,
  Chip,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";

interface BorrowerDetail {
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
  updatedAt: Date;
  _count: { loans: number };
  loans: Array<{
    id: string;
    loanAmount: number;
    interestRate: number;
    loanTermMonths: number;
    monthlyPayment: number;
    status: string;
    purpose: string | null;
    createdAt: Date;
    property: { title: string; type: string } | null;
  }>;
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

export default function BorrowerDetailPage() {
  const params = useParams();
  const [borrower, setBorrower] = useState<BorrowerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBorrower() {
      try {
        const res = await fetch(`/api/borrowers/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setBorrower(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch borrower:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchBorrower();
  }, [params.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <Card>
          <Card.Content className="h-40" />
        </Card>
      </div>
    );
  }

  if (!borrower) {
    return <p className="text-slate-500">Borrower not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/borrowers" className="text-sm text-blue-500 hover:text-blue-600">
            &larr; Back to Borrowers
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            {borrower.firstName} {borrower.lastName}
          </h2>
        </div>
        <Chip color="accent" variant="soft">
          {borrower._count.loans} Mortgage(s)
        </Chip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header>
            <p className="font-semibold text-slate-800">Personal Information</p>
          </Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm text-slate-800">{borrower.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Phone</span>
              <span className="text-sm text-slate-800">{borrower.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">NIN</span>
              <span className="text-sm text-slate-800">{borrower.nin || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Address</span>
              <span className="text-sm text-slate-800 text-right max-w-[200px]">{borrower.address}</span>
            </div>
          </Card.Content>
        </Card>

        {/* Employment Info */}
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header>
            <p className="font-semibold text-slate-800">Employment Information</p>
          </Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Occupation</span>
              <span className="text-sm text-slate-800">{borrower.occupation || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Employer</span>
              <span className="text-sm text-slate-800">{borrower.employer || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Monthly Income</span>
              <span className="text-sm font-medium text-slate-800">{formatCurrency(borrower.monthlyIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Registered</span>
              <span className="text-sm text-slate-800">{formatDate(borrower.createdAt)}</span>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Loan History */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header className="flex flex-row items-center justify-between">
          <p className="font-semibold text-slate-800">Mortgage History</p>
          <Link href="/admin/mortgages/new">
            <Button size="sm" variant="primary">
              New Mortgage
            </Button>
          </Link>
        </Card.Header>
        <Card.Content className="p-0">
          {borrower.loans.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Loan history">
                  <TableHeader>
                    <TableColumn isRowHeader>PROPERTY</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>TERM</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={borrower.loans}>
                    {(loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <p className="font-medium text-sm text-slate-800">{loan.property?.title || "—"}</p>
                          <p className="text-xs text-slate-500">{loan.property?.type || ""}</p>
                        </TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-slate-800">{loan.loanTermMonths} months</TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[loan.status] || "default"} variant="soft">
                            {loan.status.replace(/_/g, " ")}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(loan.createdAt)}</TableCell>
                        <TableCell>
                          <Link href={`/admin/mortgages/${loan.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">No mortgages found for this borrower</div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

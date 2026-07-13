"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip, Button } from "@heroui/react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiResponse } from "@/types";

interface Loan {
  id: string;
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  purpose: string | null;
  status: string;
  createdAt: Date;
  property: {
    title: string;
    type: string;
    address: string;
  } | null;
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

export default function BorrowerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoans() {
      try {
        const res = await fetch("/api/borrower/loans");
        const json: ApiResponse<Loan[]> = await res.json();
        if (json.success && json.data) {
          setLoans(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch loans:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoans();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Mortgages</h2>
        <p className="text-sm text-slate-500">View your mortgage applications and status</p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="My mortgages">
                  <TableHeader>
                    <TableColumn isRowHeader>PROPERTY</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>TERM</TableColumn>
                    <TableColumn>MONTHLY</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={loans}>
                    {(loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{loan.property?.title || "—"}</p>
                            <p className="text-xs text-slate-500">{loan.property?.type || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-slate-800">{loan.interestRate}%</TableCell>
                        <TableCell className="text-slate-800">{loan.loanTermMonths} mo</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(loan.monthlyPayment)}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[loan.status] || "default"} variant="soft">
                            {loan.status.replace(/_/g, " ")}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(loan.createdAt)}</TableCell>
                        <TableCell>
                          <Link href={`/borrower/mortgages/${loan.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

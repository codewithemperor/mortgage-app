"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Chip, Tabs, Pagination } from "@heroui/react";
import Link from "next/link";
import { formatDate, formatCurrency, formatPercentage } from "@/lib/utils";
import { ApiResponse, PaginatedResponse } from "@/types";

interface Loan {
  id: string;
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  monthlyPayment: number;
  status: string;
  purpose: string | null;
  createdAt: Date;
  borrower: { firstName: string; lastName: string; email: string };
  property: { title: string; type: string } | null;
  reviewer: { name: string } | null;
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

const STATUS_TABS = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "DISBURSED", "COMPLETED", "DEFAULTED"];

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res = await fetch(`/api/loans?${params}`);
      const json: ApiResponse<PaginatedResponse<Loan>> = await res.json();
      if (json.success && json.data) {
        setLoans(json.data.data);
        setTotal(json.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch loans:", error);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mortgages</h2>
          <p className="text-sm text-slate-500">Manage mortgage applications</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/mortgages/plans">
            <Button variant="outline">Mortgage Plans</Button>
          </Link>
          <Link href="/admin/mortgages/new">
            <Button variant="primary">New Application</Button>
          </Link>
        </div>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key as string);
          setPage(1);
        }}
      >
        <Tabs.List>
          {STATUS_TABS.map((tab) => (
            <Tabs.Tab key={tab} id={tab}>
              {tab.replace(/_/g, " ")}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading mortgages...</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Mortgages list">
                  <TableHeader>
                    <TableColumn isRowHeader>BORROWER</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>RATE</TableColumn>
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
                          <p className="font-medium text-sm text-slate-800">{loan.borrower.firstName} {loan.borrower.lastName}</p>
                          <p className="text-xs text-slate-500">{loan.borrower.email}</p>
                        </TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatPercentage(loan.interestRate)}</TableCell>
                        <TableCell className="text-slate-800">{loan.loanTermMonths}mo</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(loan.monthlyPayment)}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[loan.status] || "default"} variant="soft">
                            {loan.status.replace(/_/g, " ")}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(loan.createdAt)}</TableCell>
                        <TableCell>
                          <Link href={`/admin/mortgages/${loan.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
              {total > pageSize && (
                <Table.Footer>
                  <Pagination size="sm">
                    <Pagination.Summary>
                      {start} to {end} of {total} results
                    </Pagination.Summary>
                    <Pagination.Content>
                      <Pagination.Item>
                        <Pagination.Previous
                          isDisabled={page === 1}
                          onPress={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          <Pagination.PreviousIcon />
                          Prev
                        </Pagination.Previous>
                      </Pagination.Item>
                      {pages.map((p) => (
                        <Pagination.Item key={p}>
                          <Pagination.Link isActive={p === page} onPress={() => setPage(p)}>
                            {p}
                          </Pagination.Link>
                        </Pagination.Item>
                      ))}
                      <Pagination.Item>
                        <Pagination.Next
                          isDisabled={page === totalPages}
                          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                          Next
                          <Pagination.NextIcon />
                        </Pagination.Next>
                      </Pagination.Item>
                    </Pagination.Content>
                  </Pagination>
                </Table.Footer>
              )}
            </Table>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

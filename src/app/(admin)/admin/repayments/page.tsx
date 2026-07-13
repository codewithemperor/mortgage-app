"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Chip, Pagination } from "@heroui/react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ApiResponse, PaginatedResponse } from "@/types";

interface Repayment {
  id: string;
  amountPaid: number;
  principalAmount: number;
  interestAmount: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNumber: string | null;
  loan: {
    id: string;
    loanAmount: number;
    status: string;
    property: { title: string } | null;
    borrower: { firstName: string; lastName: string };
  };
}

export default function RepaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const fetchRepayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (statusFilter) params.set("loanId", statusFilter);

      const res = await fetch(`/api/repayments?${params}`);
      const json: ApiResponse<PaginatedResponse<Repayment>> = await res.json();
      if (json.success && json.data) {
        setRepayments(json.data.data);
        setTotal(json.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch repayments:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRepayments();
  }, [fetchRepayments]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Repayments</h2>
        <p className="text-sm text-slate-500">Track mortgage repayments</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!statusFilter ? "primary" : "outline"}
            onPress={() => { setStatusFilter(""); setPage(1); }}
          >
            All
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12 text-slate-400 text-sm">
              Loading repayments...
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Repayments list">
                  <TableHeader>
                    <TableColumn isRowHeader>BORROWER</TableColumn>
                    <TableColumn>MORTGAGE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>METHOD</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>RECEIPT</TableColumn>
                  </TableHeader>
                  <TableBody items={repayments}>
                    {(rep) => (
                      <TableRow key={rep.id}>
                        <TableCell>
                          <p className="font-medium text-sm text-slate-800">{rep.loan.borrower.firstName} {rep.loan.borrower.lastName}</p>
                        </TableCell>
                        <TableCell className="text-sm text-slate-800">
                          {rep.loan.property?.title || formatCurrency(rep.loan.loanAmount)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(rep.amountPaid)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(rep.principalAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(rep.interestAmount)}</TableCell>
                        <TableCell className="text-slate-800">{rep.paymentMethod.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-slate-500">{formatDate(rep.paymentDate)}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-500">{rep.receiptNumber || "—"}</span>
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

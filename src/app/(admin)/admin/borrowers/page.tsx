"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Chip,
  Separator,
  Pagination,
} from "@heroui/react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ApiResponse, PaginatedResponse } from "@/types";

function AddIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nin: string | null;
  occupation: string | null;
  monthlyIncome: number;
  createdAt: Date;
  _count: { loans: number };
}

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const fetchBorrowers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
        search,
      });
      const res = await fetch(`/api/borrowers?${params}`);
      const json: ApiResponse<PaginatedResponse<Borrower>> = await res.json();
      if (json.success && json.data) {
        setBorrowers(json.data.data);
        setTotal(json.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch borrowers:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Borrowers</h2>
          <p className="text-sm text-slate-500">Manage borrower records</p>
        </div>
        <Link href="/admin/borrowers/new">
          <Button variant="primary">
            <AddIcon />
            Add Borrower
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Header className="flex gap-4">
          <input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Card.Header>
        <Separator />
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : borrowers.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Borrowers list">
                  <TableHeader>
                    <TableColumn isRowHeader>NAME</TableColumn>
                    <TableColumn>CONTACT</TableColumn>
                    <TableColumn>OCCUPATION</TableColumn>
                    <TableColumn>INCOME</TableColumn>
                    <TableColumn>MORTGAGES</TableColumn>
                    <TableColumn>REGISTERED</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={borrowers}>
                    {(borrower) => (
                      <TableRow key={borrower.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">
                              {borrower.firstName} {borrower.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{borrower.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-800">{borrower.phone}</p>
                          {borrower.nin && (
                            <p className="text-xs text-slate-500">NIN: {borrower.nin}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-800">{borrower.occupation || "—"}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(borrower.monthlyIncome)}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={borrower._count.loans > 0 ? "accent" : "default"} variant="soft">
                            {borrower._count.loans}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(borrower.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/borrowers/${borrower.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
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
          ) : (
            <div className="text-center py-8 text-slate-400">No borrowers found</div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip, Button, Modal, Pagination } from "@heroui/react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentRequestItem {
  id: string;
  amount: number;
  reference: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  reviewComments: string | null;
  borrower: { id: string; firstName: string; lastName: string; email: string; phone: string };
  loan: { id: string; loanAmount: number; status: string; property: { title: string } | null };
  reviewer: { id: string; name: string } | null;
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const pageSize = 10;
  const totalPages = Math.ceil(total / pageSize);
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), pageSize: "10" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/payment-requests?${params}`);
    const json = await res.json();
    if (json.success) {
      setRequests(json.data.data);
      setTotal(json.data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleReview = (req: PaymentRequestItem, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewComment("");
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedRequest) return;
    setReviewing(true);
    await fetch(`/api/payment-requests/${selectedRequest.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: reviewAction,
        comments: reviewComment,
      }),
    });
    setReviewing(false);
    setReviewModal(false);
    fetchRequests();
  };

  const statusColorMap: Record<string, "warning" | "success" | "danger"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Payment Requests</h2>
        <p className="text-slate-500">Review and manage borrower payment submissions</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <Button
            key={status || "ALL"}
            variant={statusFilter === status ? "primary" : "outline"}
            size="sm"
            onPress={() => { setStatusFilter(status); setPage(1); }}
          >
            {status || "All"}
          </Button>
        ))}
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No payment requests found.</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Payment requests">
                  <TableHeader>
                    <TableColumn isRowHeader>BORROWER</TableColumn>
                    <TableColumn>PROPERTY</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>REFERENCE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={requests}>
                    {(req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{req.borrower.firstName} {req.borrower.lastName}</p>
                            <p className="text-xs text-slate-500">{req.borrower.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">{req.loan.property?.title || "N/A"}</TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(req.amount)}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{req.reference}</span>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[req.status] || "default"} variant="soft">
                            {req.status}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-500">{formatDate(req.createdAt)}</TableCell>
                        <TableCell>
                          {req.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="primary" onPress={() => handleReview(req, "APPROVE")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger" onPress={() => handleReview(req, "REJECT")}>
                                Reject
                              </Button>
                            </div>
                          )}
                          {req.status !== "PENDING" && (
                            <span className="text-xs text-slate-400">
                              {req.reviewComments && `"${req.reviewComments}"`}
                            </span>
                          )}
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

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onOpenChange={setReviewModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  {reviewAction === "APPROVE" ? "Approve" : "Reject"} Payment Request
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {selectedRequest && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    <p className="text-sm"><span className="text-slate-500">Borrower:</span> {selectedRequest.borrower.firstName} {selectedRequest.borrower.lastName}</p>
                    <p className="text-sm"><span className="text-slate-500">Amount:</span> {formatCurrency(selectedRequest.amount)}</p>
                    <p className="text-sm"><span className="text-slate-500">Reference:</span> {selectedRequest.reference}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Comments (optional)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add a note about this decision..."
                    rows={3}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setReviewModal(false)}>Cancel</Button>
                <Button
                  variant={reviewAction === "APPROVE" ? "primary" : "danger"}
                  onPress={submitReview}
                  isDisabled={reviewing}
                >
                  {reviewAction === "APPROVE" ? "Approve Payment" : "Reject Payment"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

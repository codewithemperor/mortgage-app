import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip } from "@heroui/react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface RecentLoan {
  id: string;
  loanAmount: number;
  status: string;
  createdAt: Date;
  borrower: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RecentLoansProps {
  loans: RecentLoan[];
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

export default function RecentLoans({ loans }: RecentLoansProps) {
  return (
    <Card className="border border-slate-200 shadow-sm">
      <Card.Header className="flex flex-row items-center justify-between">
        <p className="text-lg font-semibold text-slate-800">Recent Mortgage Applications</p>
        <a href="/admin/mortgages" className="text-sm text-blue-500 hover:text-blue-600">
          View All →
        </a>
      </Card.Header>
      <Card.Content className="p-0">
        {loans.length > 0 ? (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Recent mortgage applications">
                <TableHeader>
                  <TableColumn isRowHeader>BORROWER</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>DATE</TableColumn>
                </TableHeader>
                <TableBody items={loans}>
                  {(loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800">
                            {loan.borrower.firstName} {loan.borrower.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{loan.borrower.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-800">{formatCurrency(loan.loanAmount)}</TableCell>
                      <TableCell>
                        <Chip size="sm" color={statusColorMap[loan.status] || "default"} variant="soft">
                          {loan.status.replace(/_/g, " ")}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-slate-500">{formatDate(loan.createdAt)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-400">No recent mortgages</div>
        )}
      </Card.Content>
    </Card>
  );
}

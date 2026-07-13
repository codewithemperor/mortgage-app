"use client";

import { useEffect, useState } from "react";
import { Card } from "@heroui/react";

export default function SettingsPage() {
  const [dbStats, setDbStats] = useState({ borrowers: 0, loans: 0, repayments: 0, properties: 0, packages: 0 });

  useEffect(() => {
    // Fetch summary stats for display
    Promise.all([
      fetch("/api/borrowers?pageSize=1").then(r => r.json()),
      fetch("/api/loans?pageSize=1").then(r => r.json()),
      fetch("/api/properties").then(r => r.json()),
      fetch("/api/mortgage-packages?all=true").then(r => r.json()),
    ]).then(([borrowers, loans, properties, packages]) => {
      setDbStats({
        borrowers: borrowers.data?.total || 0,
        loans: loans.data?.total || 0,
        repayments: 0,
        properties: properties.data?.length || 0,
        packages: packages.data?.length || 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-500">Application configuration and system information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header className="border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Application Info</h3>
          </Card.Header>
          <Card.Content className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Application Name</span>
              <span className="font-medium text-slate-800">MortgagePro</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span className="font-medium text-slate-800">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Environment</span>
              <span className="font-medium text-slate-800">Development</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Framework</span>
              <span className="font-medium text-slate-800">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Database</span>
              <span className="font-medium text-slate-800">PostgreSQL</span>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header className="border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Database Summary</h3>
          </Card.Header>
          <Card.Content className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Borrowers</span>
              <span className="font-medium text-slate-800">{dbStats.borrowers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Mortgages</span>
              <span className="font-medium text-slate-800">{dbStats.loans}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Properties Listed</span>
              <span className="font-medium text-slate-800">{dbStats.properties}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mortgage Plans</span>
              <span className="font-medium text-slate-800">{dbStats.packages}</span>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header className="border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Authentication</h3>
          </Card.Header>
          <Card.Content className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Admin Auth</span>
              <span className="font-medium text-slate-800">NextAuth v5 (JWT)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Borrower Auth</span>
              <span className="font-medium text-slate-800">Custom JWT (jose)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Session Duration</span>
              <span className="font-medium text-slate-800">24 hours</span>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header className="border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Currency Settings</h3>
          </Card.Header>
          <Card.Content className="p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Currency</span>
              <span className="font-medium text-slate-800">Nigerian Naira (₦)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ISO Code</span>
              <span className="font-medium text-slate-800">NGN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Locale</span>
              <span className="font-medium text-slate-800">en-NG</span>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

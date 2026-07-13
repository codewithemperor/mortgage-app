"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Card, TextField, Input, Label } from "@heroui/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Card variant="default" className="w-full max-w-md mx-4 p-8">
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MortgagePro</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}
          <TextField value={email} onChange={setEmail}>
            <Label>Email</Label>
            <Input type="email" placeholder="Enter your email" />
          </TextField>
          <TextField value={password} onChange={setPassword}>
            <Label>Password</Label>
            <Input type="password" placeholder="Enter your password" />
          </TextField>
          <Button type="submit" variant="primary" fullWidth isDisabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          <p className="font-medium mb-1">Demo Accounts:</p>
          <p>admin@mortgagepro.com / password123</p>
          <p>manager@mortgagepro.com / password123</p>
          <p>officer@mortgagepro.com / password123</p>
        </div>
      </Card>
    </div>
  );
}

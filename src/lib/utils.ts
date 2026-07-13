import { type ClassValue, clsx } from "clsx";

// Simple clsx - if clsx isn't installed, use a basic version
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercentage(rate: number | string): string {
  const num = typeof rate === "string" ? parseFloat(rate) : rate;
  return `${num.toFixed(2)}%`;
}

export function generateReceiptNumber(): string {
  const prefix = "RCP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// API response helper
// Usage: apiResponse(data) | apiResponse(data, message) | apiResponse(data, message, status)
// For errors: apiResponse(null, errorMessage, statusCode)
export function apiResponse<T>(
  data?: T,
  message?: string,
  status = 200
) {
  const success = status < 400;
  return Response.json(
    { success, data, error: success ? undefined : message, message: success ? message : undefined },
    { status }
  );
}

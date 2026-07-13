import { verifyBorrowerToken, COOKIE_NAME, type BorrowerPayload } from "@/lib/portal-auth";
import { apiResponse } from "@/lib/utils";

/** Extract and verify borrower from request cookie. Returns null + 401 response if invalid. */
export async function getBorrowerFromRequest(
  request: Request
): Promise<{ borrower: BorrowerPayload | null; response: Response | null }> {
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) {
    return { borrower: null, response: apiResponse(null, "Not authenticated", 401) };
  }

  const payload = await verifyBorrowerToken(token);
  if (!payload) {
    return { borrower: null, response: apiResponse(null, "Session expired", 401) };
  }

  return { borrower: payload, response: null };
}

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.BORROWER_JWT_SECRET || "mortgage-pro-borrower-secret-key-2026"
);

const COOKIE_NAME = "borrower.session-token";

export interface BorrowerPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** Sign a JWT for a borrower session */
export async function signBorrowerToken(payload: BorrowerPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

/** Verify and decode a borrower JWT */
export async function verifyBorrowerToken(
  token: string
): Promise<BorrowerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };

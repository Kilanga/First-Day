import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const MENTOR_SESSION_COOKIE = "first-day-mentor-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secret() {
  const value = process.env.MENTOR_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("MENTOR_SESSION_SECRET must be configured with at least 32 characters.");
  return value;
}

/** Fail before a write route changes data when private-session signing is unavailable. */
export function assertMentorSessionConfigured() {
  secret();
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  return header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function isMentorId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function getMentorIdFromCookieHeader(header: string | null) {
  const encoded = readCookie(header, MENTOR_SESSION_COOKIE);
  if (!encoded) return undefined;
  const token = decodeURIComponent(encoded);
  const [mentorId, expiryText, suppliedSignature] = token.split(".");
  const expiresAt = Number(expiryText);
  if (!isMentorId(mentorId) || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || !suppliedSignature) return undefined;
  const expectedSignature = signature(`${mentorId}.${expiresAt}`);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return undefined;
  return mentorId;
}

export function requireMentorId(request: Request) {
  const mentorId = getMentorIdFromCookieHeader(request.headers.get("cookie"));
  if (!mentorId) throw new Error("Your private learning session has expired. Return to your learning desk and try again.");
  return mentorId;
}

export function resolveMentorId(request: Request, suppliedMentorId: unknown) {
  const existingMentorId = getMentorIdFromCookieHeader(request.headers.get("cookie"));
  if (existingMentorId) {
    if (suppliedMentorId !== undefined && suppliedMentorId !== existingMentorId) throw new Error("This browser is already linked to another private learning desk.");
    return { mentorId: existingMentorId, shouldIssueCookie: false };
  }
  if (!isMentorId(suppliedMentorId)) throw new Error("A private mentor session is required.");
  return { mentorId: suppliedMentorId, shouldIssueCookie: true };
}

export function issueMentorSession(response: NextResponse, mentorId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const value = `${mentorId}.${expiresAt}.${signature(`${mentorId}.${expiresAt}`)}`;
  response.cookies.set({ name: MENTOR_SESSION_COOKIE, value, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE_SECONDS });
  return response;
}

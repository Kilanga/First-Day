import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { getMentorIdFromCookieHeader, issueMentorSession } from "@/lib/mentorSession";

process.env.MENTOR_SESSION_SECRET = "test-secret-that-is-long-enough-to-sign-session-cookies";

describe("anonymous mentor sessions", () => {
  it("accepts a valid signed cookie and rejects a tampered one", () => {
    const mentorId = "6f31a938-4a8f-4a6f-a0cf-8a0db42a374e";
    const response = issueMentorSession(new NextResponse(), mentorId);
    const cookie = response.headers.get("set-cookie");

    expect(cookie).toBeTruthy();
    expect(getMentorIdFromCookieHeader(cookie)).toBe(mentorId);
    expect(getMentorIdFromCookieHeader(cookie!.replace("6f31", "7f31"))).toBeUndefined();
  });
});

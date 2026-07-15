import { prisma } from "./prisma";
import { createHash } from "node:crypto";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function clientAddress(request: Request) {
  const value = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  return value.split(",")[0]?.trim().slice(0, 100) || "unknown";
}

/** A hashed, short-lived network key for public creation endpoints. */
export async function consumeIpQuota(request: Request, scope: "subject" | "claim", limit: number) {
  const digest = createHash("sha256").update(clientAddress(request)).digest("hex").slice(0, 24);
  return consumeCounter(`ip:${scope}:${digest}`, limit, HOUR_MS);
}

async function consumeCounter(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const existing = await prisma.rateLimitCounter.findUnique({ where: { key } });
  const expired = !existing || now.getTime() - existing.windowStart.getTime() >= windowMs;
  if (!expired && existing.count >= limit) return false;
  await prisma.rateLimitCounter.upsert({
    where: { key },
    create: { key, count: 1, windowStart: now },
    update: expired ? { count: 1, windowStart: now } : { count: { increment: 1 } },
  });
  return true;
}

/** Protects model-backed routes other than chat from accidental or abusive spend. */
export async function consumeAiActionQuota(mentorId: string, action: "subject" | "report" | "feedback" | "trial") {
  const configuredSubjectCap = Number(process.env.SUBJECT_HOURLY_CAP ?? 10);
  const subjectHourlyCap = Number.isFinite(configuredSubjectCap) && configuredSubjectCap > 0 ? configuredSubjectCap : 10;
  const hourlyLimit = action === "subject" ? subjectHourlyCap : action === "trial" ? 5 : 10;
  const dailyCap = Number(process.env.DAILY_AI_CALL_CAP ?? 100);
  const day = new Date().toISOString().slice(0, 10);
  const actionAllowed = await consumeCounter(`ai:${action}:${mentorId}`, hourlyLimit, HOUR_MS);
  if (!actionAllowed) return false;
  const dailyAllowed = await consumeCounter(`ai:daily:${day}`, Number.isFinite(dailyCap) && dailyCap > 0 ? dailyCap : 100, DAY_MS);
  if (!dailyAllowed) {
    await prisma.rateLimitCounter.updateMany({ where: { key: `ai:${action}:${mentorId}`, count: { gt: 0 } }, data: { count: { decrement: 1 } } });
  }
  return dailyAllowed;
}

/** Reverses a model-action reservation when no request reached the model. */
export async function refundAiActionQuota(mentorId: string, action: "subject" | "report" | "feedback" | "trial") {
  const day = new Date().toISOString().slice(0, 10);
  await prisma.$transaction([
    prisma.rateLimitCounter.updateMany({ where: { key: `ai:${action}:${mentorId}`, count: { gt: 0 } }, data: { count: { decrement: 1 } } }),
    prisma.rateLimitCounter.updateMany({ where: { key: `ai:daily:${day}`, count: { gt: 0 } }, data: { count: { decrement: 1 } } }),
  ]);
}

export async function consumeMessageQuota(mentorId: string) {
  const now = new Date();
  const mentorKey = `mentor:${mentorId}`;
  const dailyCap = Number(process.env.DAILY_MESSAGE_CAP);
  const hasDailyCap = Number.isFinite(dailyCap) && dailyCap > 0;
  const dailyKey = `daily:${now.toISOString().slice(0, 10)}`;
  const [mentorCounter, dailyCounter] = await Promise.all([
    prisma.rateLimitCounter.findUnique({ where: { key: mentorKey } }),
    hasDailyCap ? prisma.rateLimitCounter.findUnique({ where: { key: dailyKey } }) : Promise.resolve(null),
  ]);

  const mentorCount = !mentorCounter || now.getTime() - mentorCounter.windowStart.getTime() >= HOUR_MS ? 0 : mentorCounter.count;
  if (mentorCount >= 20 || (hasDailyCap && (dailyCounter?.count ?? 0) >= dailyCap)) return false;

  await prisma.$transaction([
    prisma.rateLimitCounter.upsert({
      where: { key: mentorKey },
      create: { key: mentorKey, count: 1, windowStart: now },
      update: mentorCount === 0 ? { count: 1, windowStart: now } : { count: { increment: 1 } },
    }),
    ...(hasDailyCap ? [prisma.rateLimitCounter.upsert({
      where: { key: dailyKey },
      create: { key: dailyKey, count: 1, windowStart: now },
      update: { count: { increment: 1 } },
    })] : []),
  ]);
  return true;
}

/** Reverses a reservation when the chat request failed before persisting a reply. */
export async function refundMessageQuota(mentorId: string) {
  const now = new Date();
  const mentorKey = `mentor:${mentorId}`;
  const dailyCap = Number(process.env.DAILY_MESSAGE_CAP);
  const hasDailyCap = Number.isFinite(dailyCap) && dailyCap > 0;
  const dailyKey = `daily:${now.toISOString().slice(0, 10)}`;
  await prisma.$transaction([
    prisma.rateLimitCounter.updateMany({ where: { key: mentorKey, count: { gt: 0 } }, data: { count: { decrement: 1 } } }),
    ...(hasDailyCap ? [prisma.rateLimitCounter.updateMany({ where: { key: dailyKey, count: { gt: 0 } }, data: { count: { decrement: 1 } } })] : []),
  ]);
}

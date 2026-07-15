import { prisma } from "./prisma";

const HOUR_MS = 60 * 60 * 1000;

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

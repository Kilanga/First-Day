import { prisma } from "@/lib/prisma";
import { requireMentorId } from "@/lib/mentorSession";

type GapReport = { strengths?: unknown; gaps?: unknown; suggestedNextSession?: unknown };

function textList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const mentorId = requireMentorId(request);
    const { sessionId } = await params;
    const session = await prisma.learningSession.findFirst({ where: { id: sessionId, subject: { mentorId } }, include: { subject: { include: { hire: true } } } });
    if (!session?.gapReport) return new Response("Report not found.", { status: 404 });
    const report = session.gapReport as GapReport;
    const strengths = textList(report.strengths);
    const gaps = Array.isArray(report.gaps) ? report.gaps.filter((gap): gap is { concept: string; whatWasMissing: string; tryNextTime: string } => Boolean(gap && typeof gap === "object" && typeof (gap as { concept?: unknown }).concept === "string" && typeof (gap as { whatWasMissing?: unknown }).whatWasMissing === "string" && typeof (gap as { tryNextTime?: unknown }).tryNextTime === "string")) : [];
    const next = typeof report.suggestedNextSession === "string" ? report.suggestedNextSession : "";
    const markdown = [`# First Day teaching reflection`, ``, `**Subject:** ${session.subject.title}`, `**Learning partner:** ${session.subject.hire?.name ?? "Learning partner"}`, `**Completed:** ${session.endedAt?.toISOString().slice(0, 10) ?? "In progress"}`, ``, `## What landed well`, ...strengths.map((item) => `- ${item}`), ``, `## Ideas to revisit`, ...gaps.flatMap((gap) => [`### ${gap.concept}`, gap.whatWasMissing, `**Next time:** ${gap.tryNextTime}`, ``]), `## Suggested next session`, next, ``].join("\n");
    const filename = `${session.subject.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "first-day"}-report.md`;
    return new Response(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
  } catch {
    return new Response("Unable to export this report.", { status: 502 });
  }
}

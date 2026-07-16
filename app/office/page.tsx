import OfficeWorkspace from "@/components/OfficeWorkspace";

export default async function OfficePage({ searchParams }: { searchParams: Promise<{ subjectId?: string; title?: string; hireName?: string; firstQuestion?: string }> }) {
  const query = await searchParams;
  return <OfficeWorkspace subjectId={query.subjectId} title={query.title ?? "Your office session"} name={query.hireName ?? "Your new hire"} initialQuestion={query.firstQuestion} />;
}

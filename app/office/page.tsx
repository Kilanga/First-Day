import OfficeWorkspace from "@/components/OfficeWorkspace";

export default function OfficePage({ searchParams }: { searchParams?: { subjectId?: string; mentorId?: string; title?: string; hireName?: string; firstQuestion?: string } }) {
  return <OfficeWorkspace subjectId={searchParams?.subjectId} mentorId={searchParams?.mentorId} title={searchParams?.title ?? "Your learning session"} name={searchParams?.hireName ?? "Sam"} initialQuestion={searchParams?.firstQuestion} />;
}

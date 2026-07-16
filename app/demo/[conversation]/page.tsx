import { notFound } from "next/navigation";
import DemoOffice from "@/components/DemoOffice";

const conversationIds = new Set(["project-foundations", "number-quest"]);

export default async function DemoConversationPage({ params }: { params: Promise<{ conversation: string }> }) {
  const { conversation } = await params;
  if (!conversationIds.has(conversation)) notFound();
  return <DemoOffice conversationId={conversation} />;
}

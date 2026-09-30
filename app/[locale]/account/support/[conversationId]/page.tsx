import { SupportThread } from './SupportThread';

export const metadata = { title: 'Conversation - Cartzii' };

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <SupportThread conversationId={conversationId} />;
}

import { TicketThread } from './TicketThread';

export const metadata = { title: 'Support ticket - Cartzii' };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketThread ticketId={ticketId} />;
}

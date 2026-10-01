import { NewTicketForm } from './NewTicketForm';

export const metadata = { title: 'New ticket - Cartzii' };

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const p = await searchParams;
  return <NewTicketForm orderId={p.orderId ? Number(p.orderId) : null} />;
}

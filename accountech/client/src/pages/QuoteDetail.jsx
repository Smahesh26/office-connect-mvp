import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Download, ArrowRightLeft } from 'lucide-react';
import { quotesApi } from '../api/endpoints';
import { Card, StatusStamp, Th, Td } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [quote, setQuote] = useState(null);

  const load = () => quotesApi.get(id).then((res) => setQuote(res.data));
  useEffect(() => { load(); }, [id]);

  if (!quote) return <p className="text-ink-700">Loading…</p>;

  const setStatus = async (status) => { await quotesApi.setStatus(id, status); load(); };
  const convert = async () => { const { data } = await quotesApi.convert(id); navigate(`/invoices/${data.id}`); };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/quotes" className="text-sm text-brass-dark hover:underline">&larr; Quotes</Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="font-display text-3xl text-ink-950">{quote.quote_number}</h1>
            <StatusStamp status={quote.status} />
          </div>
          <p className="text-ink-700/70 text-sm mt-1">{quote.customer_name} &middot; Expires {formatDate(quote.expiry_date)}</p>
        </div>
        <div className="flex gap-2">
          <a href={quotesApi.pdfUrl(id)} target="_blank" rel="noreferrer" className="btn-ghost"><Download className="w-4 h-4" /> PDF</a>
          {quote.status === 'draft' && <button className="btn-ghost" onClick={() => setStatus('sent')}>Mark sent</button>}
          {quote.status === 'sent' && <button className="btn-ghost" onClick={() => setStatus('accepted')}>Mark accepted</button>}
          {quote.status === 'accepted' && !quote.converted_invoice_id && can('invoices.create') && (
            <button className="btn-brass" onClick={convert}><ArrowRightLeft className="w-4 h-4" /> Convert to invoice</button>
          )}
        </div>
      </div>

      <Card>
        <table className="w-full">
          <thead><tr className="border-b border-line-light"><Th>Description</Th><Th align="right">Qty</Th><Th align="right">Price</Th><Th align="right">Total</Th></tr></thead>
          <tbody className="divide-y divide-line-light">
            {quote.items.map((it) => (
              <tr key={it.id}>
                <Td>{it.description}</Td>
                <Td align="right" className="num">{it.quantity}</Td>
                <Td align="right" className="num">{formatMoney(it.unit_price, quote.currency_symbol)}</Td>
                <Td align="right" className="num">{formatMoney(it.total, quote.currency_symbol)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-700">Subtotal</span><span className="num">{formatMoney(quote.subtotal, quote.currency_symbol)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-700">Tax</span><span className="num">{formatMoney(quote.tax_total, quote.currency_symbol)}</span></div>
            <div className="flex justify-between ledger-total"><span>Total</span><span>{formatMoney(quote.total, quote.currency_symbol)}</span></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

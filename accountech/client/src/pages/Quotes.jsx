import { useEffect, useState } from 'react';
import { Plus, FileSignature, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { quotesApi } from '../api/endpoints';
import { Card, EmptyState, Th, Td, StatusStamp } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function Quotes() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { quotesApi.list({ search }).then((res) => setRows(res.data.data)); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Quotes</h1>
          <p className="text-ink-700/70 text-sm mt-1">Estimates waiting to become invoices.</p>
        </div>
        {can('quotes.create') && <Link to="/quotes/new" className="btn-brass"><Plus className="w-4 h-4" /> New quote</Link>}
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600/50" />
          <input className="input pl-9" placeholder="Search quote # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={FileSignature} title="No quotes yet" description="Send an estimate before you invoice." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Number</Th><Th>Customer</Th><Th>Expires</Th><Th align="right">Total</Th><Th align="right">Status</Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {rows.map((q) => (
                  <tr key={q.id} className="hover:bg-ink-950/[0.02]">
                    <Td><Link to={`/quotes/${q.id}`} className="font-medium hover:text-brass-dark">{q.quote_number}</Link></Td>
                    <Td>{q.customer_name}</Td>
                    <Td className="text-ink-700/70">{formatDate(q.expiry_date)}</Td>
                    <Td align="right" className="num">{formatMoney(q.total, q.currency_symbol)}</Td>
                    <Td align="right"><StatusStamp status={q.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

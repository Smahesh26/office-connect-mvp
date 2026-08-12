import { useEffect, useState } from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { invoicesApi } from '../api/endpoints';
import { Card, EmptyState, Th, Td, StatusStamp } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const statuses = ['', 'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    invoicesApi.list({ search, status }).then((res) => setRows(res.data.data));
  }, [search, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Invoices</h1>
          <p className="text-ink-700/70 text-sm mt-1">Bill your customers and track what's owed.</p>
        </div>
        {can('invoices.create') && (
          <Link to="/invoices/new" className="btn-brass"><Plus className="w-4 h-4" /> New invoice</Link>
        )}
      </div>

      <Card>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600/50" />
            <input className="input pl-9" placeholder="Search invoice # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}</option>)}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices found" description="Create your first invoice to get paid." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Number</Th><Th>Customer</Th><Th>Due</Th><Th align="right">Total</Th><Th align="right">Balance</Th><Th align="right">Status</Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {rows.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ink-950/[0.02]">
                    <Td><Link to={`/invoices/${inv.id}`} className="font-medium hover:text-brass-dark">{inv.invoice_number}</Link></Td>
                    <Td>{inv.customer_name}</Td>
                    <Td className="text-ink-700/70">{formatDate(inv.due_date)}</Td>
                    <Td align="right" className="num">{formatMoney(inv.total, inv.currency_symbol)}</Td>
                    <Td align="right" className="num">{formatMoney(inv.amount_due, inv.currency_symbol)}</Td>
                    <Td align="right"><StatusStamp status={inv.status} /></Td>
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

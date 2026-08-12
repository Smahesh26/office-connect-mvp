import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customersApi } from '../api/endpoints';
import { Card, StatusStamp } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => { customersApi.get(id).then((res) => setCustomer(res.data)); }, [id]);

  if (!customer) return <p className="text-ink-700">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/customers" className="text-sm text-brass-dark hover:underline">&larr; Customers</Link>
        <h1 className="font-display text-3xl text-ink-950 mt-2">{customer.display_name}</h1>
        <p className="text-ink-700/70 text-sm">{customer.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Contact details" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-ink-700/60 text-xs uppercase">Company</dt><dd>{customer.company_name || '—'}</dd></div>
            <div><dt className="text-ink-700/60 text-xs uppercase">Phone</dt><dd>{customer.phone || '—'}</dd></div>
            <div><dt className="text-ink-700/60 text-xs uppercase">Tax number</dt><dd>{customer.tax_number || '—'}</dd></div>
            <div><dt className="text-ink-700/60 text-xs uppercase">Billing address</dt><dd>{customer.billing_address || '—'}</dd></div>
            <div><dt className="text-ink-700/60 text-xs uppercase">Notes</dt><dd>{customer.notes || '—'}</dd></div>
          </dl>
        </Card>

        <Card title="Recent invoices" className="lg:col-span-2">
          <div className="divide-y divide-line-light -mx-5">
            {customer.recent_invoices.map((inv) => (
              <Link to={`/invoices/${inv.id}`} key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-ink-950/[0.02]">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-ink-700/70">Due {formatDate(inv.due_date)}</p>
                </div>
                <div className="text-right">
                  <p className="num text-sm">{formatMoney(inv.total)}</p>
                  <StatusStamp status={inv.status} />
                </div>
              </Link>
            ))}
            {!customer.recent_invoices.length && <p className="px-5 py-6 text-sm text-ink-700/60">No invoices for this customer yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

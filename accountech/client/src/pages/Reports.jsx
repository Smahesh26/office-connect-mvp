import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { reportsApi } from '../api/endpoints';
import { Card, Th, Td } from '../components/ui/Primitives';
import { formatMoney } from '../utils/format';

const TABS = ['Profit & Loss', 'Invoice Aging', 'Sales by Customer'];

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [pnl, setPnl] = useState(null);
  const [aging, setAging] = useState(null);
  const [sales, setSales] = useState(null);

  useEffect(() => {
    reportsApi.profitAndLoss().then((res) => setPnl(res.data));
    reportsApi.invoiceAging().then((res) => setAging(res.data));
    reportsApi.salesByCustomer().then((res) => setSales(res.data));
  }, []);

  const agingChartData = aging ? Object.entries(aging.buckets).map(([bucket, total]) => ({ bucket, total })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-950">Reports</h1>
        <p className="text-ink-700/70 text-sm mt-1">The numbers behind the numbers.</p>
      </div>

      <div className="flex gap-2 border-b border-line-light">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === i ? 'border-brass text-ink-950' : 'border-transparent text-ink-700/60 hover:text-ink-950'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && pnl && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><p className="label">Income</p><p className="num text-2xl text-ledger-green">{formatMoney(pnl.income)}</p></Card>
            <Card><p className="label">Expense</p><p className="num text-2xl text-ledger-rust">{formatMoney(pnl.expense)}</p></Card>
            <Card><p className="label">Net profit</p><p className="num text-2xl">{formatMoney(pnl.net_profit)}</p></Card>
          </div>
          <Card title="By category">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Category</Th><Th>Type</Th><Th align="right">Total</Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {pnl.by_category.map((r, i) => (
                  <tr key={i}><Td>{r.category}</Td><Td className="capitalize text-ink-700/70">{r.type}</Td>
                    <Td align="right" className={`num ${r.type === 'income' ? 'text-ledger-green' : 'text-ledger-rust'}`}>{formatMoney(r.total)}</Td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 1 && aging && (
        <div className="space-y-6">
          <Card title="Outstanding by age">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agingChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD1" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {agingChartData.map((d, i) => <Cell key={i} fill={d.bucket === 'current' ? '#1F6F54' : d.bucket === '90+' ? '#B4432F' : '#C9A227'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Outstanding invoices">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Invoice</Th><Th>Customer</Th><Th>Bucket</Th><Th align="right">Balance</Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {aging.invoices.map((inv) => (
                  <tr key={inv.id}><Td>{inv.invoice_number}</Td><Td>{inv.customer_name}</Td><Td className="capitalize text-ink-700/70">{inv.bucket}</Td>
                    <Td align="right" className="num">{formatMoney(inv.amount_due)}</Td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 2 && sales && (
        <Card title="Sales by customer">
          <table className="w-full">
            <thead><tr className="border-b border-line-light"><Th>Customer</Th><Th align="right">Invoices</Th><Th align="right">Billed</Th><Th align="right">Paid</Th></tr></thead>
            <tbody className="divide-y divide-line-light">
              {sales.map((c) => (
                <tr key={c.id}><Td>{c.display_name}</Td><Td align="right">{c.invoice_count}</Td>
                  <Td align="right" className="num">{formatMoney(c.total_billed)}</Td>
                  <Td align="right" className="num text-ledger-green">{formatMoney(c.total_paid)}</Td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../api/endpoints';
import { Card, StatusStamp } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { Link } from 'react-router-dom';

function Kpi({ icon: Icon, label, value, tone = 'ink' }) {
  const toneClasses = {
    ink: 'text-ink-950', green: 'text-ledger-green', rust: 'text-ledger-rust', brass: 'text-brass-dark',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-700">{label}</p>
        <Icon className={`w-4 h-4 ${toneClasses[tone]}`} strokeWidth={1.75} />
      </div>
      <p className={`num text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardApi.summary().then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-ink-700">Loading dashboard…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink-950">Dashboard</h1>
        <p className="text-ink-700/70 text-sm mt-1">The month at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Income this month" value={formatMoney(data.income_this_month)} tone="green" />
        <Kpi icon={TrendingDown} label="Expenses this month" value={formatMoney(data.expense_this_month)} tone="rust" />
        <Kpi icon={Wallet} label="Cash balance" value={formatMoney(data.cash_balance)} tone="ink" />
        <Kpi icon={AlertTriangle} label="Overdue" value={formatMoney(data.overdue_total)} tone="rust" />
      </div>

      <Card title="Cash flow — last 6 months">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.monthly_cashflow}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1F6F54" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B4432F" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#B4432F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD1" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#334268' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#334268' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 8, borderColor: '#E4DFD1', fontSize: 13 }} />
            <Area type="monotone" dataKey="income" stroke="#1F6F54" strokeWidth={2} fill="url(#income)" name="Income" />
            <Area type="monotone" dataKey="expense" stroke="#B4432F" strokeWidth={2} fill="url(#expense)" name="Expense" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent invoices" action={<Link to="/invoices" className="text-sm text-brass-dark hover:underline">View all</Link>}>
          <div className="divide-y divide-line-light -mx-5">
            {data.recent_invoices.map((inv) => (
              <Link to={`/invoices/${inv.id}`} key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-ink-950/[0.02]">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-ink-700/70">{inv.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="num text-sm">{formatMoney(inv.total)}</p>
                  <StatusStamp status={inv.status} />
                </div>
              </Link>
            ))}
            {!data.recent_invoices.length && <p className="px-5 py-6 text-sm text-ink-700/60">No invoices yet.</p>}
          </div>
        </Card>

        <Card title="Top customers">
          <div className="space-y-3">
            {data.top_customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <p className="text-sm">{c.display_name}</p>
                <p className="num text-sm font-medium">{formatMoney(c.total_billed)}</p>
              </div>
            ))}
            {!data.top_customers.length && <p className="text-sm text-ink-700/60">No customer activity yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

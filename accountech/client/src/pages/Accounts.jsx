import { useEffect, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { accountsApi } from '../api/endpoints';
import { Card, Modal, EmptyState, Th, Td } from '../components/ui/Primitives';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const empty = { code: '', name: '', type: 'asset', opening_balance: 0, description: '' };
const typeColor = { asset: 'text-ink-950', liability: 'text-ledger-rust', equity: 'text-brass-dark', income: 'text-ledger-green', expense: 'text-ledger-rust' };

export default function Accounts() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => accountsApi.list().then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await accountsApi.create(form);
    setModalOpen(false);
    setForm(empty);
    load();
  };

  const grouped = rows.reduce((acc, a) => { (acc[a.type] = acc[a.type] || []).push(a); return acc; }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Chart of Accounts</h1>
          <p className="text-ink-700/70 text-sm mt-1">Where every dollar lives.</p>
        </div>
        {can('accounts.create') && <button className="btn-brass" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> New account</button>}
      </div>

      {rows.length === 0 ? (
        <Card><EmptyState icon={BookOpen} title="No accounts yet" description="Set up your chart of accounts to start tracking transactions." /></Card>
      ) : (
        Object.entries(grouped).map(([type, accs]) => (
          <Card key={type} title={type[0].toUpperCase() + type.slice(1) + 's'}>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full">
                <thead><tr className="border-b border-line-light"><Th>Code</Th><Th>Name</Th><Th align="right">Balance</Th></tr></thead>
                <tbody className="divide-y divide-line-light">
                  {accs.map((a) => (
                    <tr key={a.id} className="hover:bg-ink-950/[0.02]">
                      <Td className="text-ink-700/70">{a.code}</Td>
                      <Td className="font-medium">{a.name}</Td>
                      <Td align="right" className={`num ${typeColor[a.type]}`}>{formatMoney(a.current_balance, a.currency_symbol || '$')}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New account">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Code *</label><input required className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="asset">Asset</option><option value="liability">Liability</option>
                <option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option>
              </select>
            </div>
          </div>
          <div><label className="label">Name *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Opening balance</label><input type="number" step="0.01" className="input" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save account</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Plus, ArrowLeftRight, Trash2 } from 'lucide-react';
import { transactionsApi, accountsApi, lookupsApi } from '../api/endpoints';
import { Card, Modal, EmptyState, Th, Td } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const empty = { type: 'expense', account_id: '', category_id: '', payment_method_id: '', amount: '', transaction_date: new Date().toISOString().slice(0, 10), description: '', reference: '' };

export default function Transactions() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);
  const [type, setType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => transactionsApi.list({ type }).then((res) => setRows(res.data.data));

  useEffect(() => { load(); }, [type]);
  useEffect(() => {
    accountsApi.list().then((res) => setAccounts(res.data));
    lookupsApi.transactionCategories.list().then((res) => setCategories(res.data));
    lookupsApi.paymentMethods.list().then((res) => setMethods(res.data));
  }, []);

  const openCreate = () => { setForm(empty); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    await transactionsApi.create({ ...form, category_id: form.category_id || null, payment_method_id: form.payment_method_id || null });
    setModalOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this transaction? This will reverse its effect on the account balance.')) return;
    await transactionsApi.remove(id);
    load();
  };

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Transactions</h1>
          <p className="text-ink-700/70 text-sm mt-1">Income and expenses, recorded against your accounts.</p>
        </div>
        {can('transactions.create') && <button className="btn-brass" onClick={openCreate}><Plus className="w-4 h-4" /> New transaction</button>}
      </div>

      <Card>
        <div className="flex gap-2 mb-4">
          {['', 'income', 'expense'].map((t) => (
            <button key={t} onClick={() => setType(t)} className={`btn-ghost !py-1.5 text-xs ${type === t ? 'bg-ink-950 text-paper' : ''}`}>
              {t ? t[0].toUpperCase() + t.slice(1) : 'All'}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" description="Record income or expenses to see your cash flow." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Date</Th><Th>Description</Th><Th>Account</Th><Th>Category</Th><Th align="right">Amount</Th><Th></Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-950/[0.02]">
                    <Td className="text-ink-700/70">{formatDate(t.transaction_date)}</Td>
                    <Td>{t.description || '—'}{t.customer_name && <span className="text-ink-700/60"> &middot; {t.customer_name}</span>}</Td>
                    <Td className="text-ink-700/70">{t.account_name}</Td>
                    <Td className="text-ink-700/70">{t.category_name || '—'}</Td>
                    <Td align="right" className={`num ${t.type === 'income' ? 'text-ledger-green' : 'text-ledger-rust'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                    </Td>
                    <Td align="right">
                      {can('transactions.delete') && <button onClick={() => remove(t.id)} className="text-ink-600/40 hover:text-ledger-rust"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New transaction">
        <form onSubmit={save} className="space-y-4">
          <div className="flex gap-2">
            {['expense', 'income'].map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category_id: '' })}
                className={`flex-1 btn-ghost ${form.type === t ? 'bg-ink-950 text-paper' : ''}`}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <div><label className="label">Amount *</label><input required type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div>
            <label className="label">Account *</label>
            <select required className="input" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
              <option value="">Select account…</option>
              {accounts.filter((a) => a.type === 'asset').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>{filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment method</label>
              <select className="input" value={form.payment_method_id} onChange={(e) => setForm({ ...form, payment_method_id: e.target.value })}>
                <option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Date</label><input type="date" className="input" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} /></div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save transaction</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

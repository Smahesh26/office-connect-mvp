import { useEffect, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { customersApi } from '../api/endpoints';
import { Card, Modal, EmptyState, Th, Td } from '../components/ui/Primitives';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const empty = { display_name: '', company_name: '', email: '', phone: '', tax_number: '', billing_address: '', billing_city: '', billing_country: '', notes: '' };

export default function Customers() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => customersApi.list({ search }).then((res) => setRows(res.data.data));

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setForm(empty); setEditingId(null); setModalOpen(true); };
  const openEdit = (c) => { setForm(c); setEditingId(c.id); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await customersApi.update(editingId, form);
      else await customersApi.create(form);
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Customers</h1>
          <p className="text-ink-700/70 text-sm mt-1">Everyone you bill, in one place.</p>
        </div>
        {can('customers.create') && (
          <button className="btn-brass" onClick={openCreate}><Plus className="w-4 h-4" /> New customer</button>
        )}
      </div>

      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600/50" />
          <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" description="Add your first customer to start invoicing." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Name</Th><Th>Email</Th><Th align="right">Outstanding</Th><Th align="right"></Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-950/[0.02]">
                    <Td><Link to={`/customers/${c.id}`} className="font-medium hover:text-brass-dark">{c.display_name}</Link></Td>
                    <Td className="text-ink-700/70">{c.email || '—'}</Td>
                    <Td align="right" className="num">{formatMoney(c.outstanding_balance)}</Td>
                    <Td align="right"><button className="text-xs text-brass-dark hover:underline" onClick={() => openEdit(c)}>Edit</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit customer' : 'New customer'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Display name *</label><input required className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company name</label><input className="input" value={form.company_name || ''} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><label className="label">Tax number</label><input className="input" value={form.tax_number || ''} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><label className="label">Billing address</label><input className="input" value={form.billing_address || ''} onChange={(e) => setForm({ ...form, billing_address: e.target.value })} /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save customer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

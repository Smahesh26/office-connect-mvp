import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { companyApi, usersApi, lookupsApi } from '../api/endpoints';
import { Card, Modal } from '../components/ui/Primitives';
import { useAuth } from '../context/AuthContext';

const TABS = ['Company', 'Users & Roles', 'Tax Rates', 'Payment Methods', 'Categories'];

function CompanyTab() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { companyApi.get().then((res) => setForm(res.data)); }, []);
  if (!form) return null;
  const save = async (e) => {
    e.preventDefault();
    await companyApi.update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <Card title="Company profile">
      <form onSubmit={save} className="space-y-4 max-w-xl">
        <div><label className="label">Company name *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Email</label><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><label className="label">Address</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">City</label><input className="input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="label">State</label><input className="input" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">Zip</label><input className="input" value={form.zip || ''} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Invoice prefix</label><input className="input" value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} /></div>
          <div><label className="label">Quote prefix</label><input className="input" value={form.quote_prefix} onChange={(e) => setForm({ ...form, quote_prefix: e.target.value })} /></div>
        </div>
        <div><label className="label">Default terms</label><textarea className="input" rows={2} value={form.default_terms || ''} onChange={(e) => setForm({ ...form, default_terms: e.target.value })} /></div>
        <button type="submit" className="btn-primary">{saved ? 'Saved ✓' : 'Save changes'}</button>
      </form>
    </Card>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });

  const load = () => usersApi.list().then((res) => setUsers(res.data));
  useEffect(() => { load(); usersApi.roles().then((res) => setRoles(res.data)); }, []);

  const save = async (e) => {
    e.preventDefault();
    await usersApi.create(form);
    setModalOpen(false);
    setForm({ name: '', email: '', password: '', role_id: '' });
    load();
  };

  const toggleActive = async (u) => { await usersApi.update(u.id, { name: u.name, role_id: u.role_id, is_active: !u.is_active }); load(); };

  return (
    <Card title="Team members" action={<button className="btn-brass !py-1.5 text-xs" onClick={() => setModalOpen(true)}><Plus className="w-3.5 h-3.5" /> Invite</button>}>
      <div className="divide-y divide-line-light -mx-5">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-ink-700/60">{u.email} &middot; <span className="capitalize">{u.role_name}</span></p>
            </div>
            <button onClick={() => toggleActive(u)} className={`text-xs ${u.is_active ? 'text-ledger-rust' : 'text-ledger-green'} hover:underline`}>
              {u.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invite team member">
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Name *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email *</label><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Temporary password *</label><input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label className="label">Role *</label>
            <select required className="input" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">Select role…</option>{roles.map((r) => <option key={r.id} value={r.id} className="capitalize">{r.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Send invite</button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function LookupTab({ api, fields, labelKey = 'name' }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const load = () => api.list().then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); await api.create(form); setForm({}); load(); };

  return (
    <Card>
      <form onSubmit={add} className="flex gap-2 mb-4">
        {fields.map((f) => (
          f.type === 'select'
            ? <select key={f.name} className="input" value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                <option value="">{f.label}</option>{f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            : <input key={f.name} type={f.type || 'text'} placeholder={f.label} className="input" value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
        ))}
        <button type="submit" className="btn-brass whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>
      </form>
      <div className="divide-y divide-line-light -mx-5">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between px-5 py-2 text-sm">
            <span>{r[labelKey]}</span>
            <span className="text-ink-700/60">{r.rate !== undefined ? `${r.rate}%` : r.type || ''}</span>
          </div>
        ))}
        {!rows.length && <p className="px-5 py-4 text-sm text-ink-700/50">None yet.</p>}
      </div>
    </Card>
  );
}

export default function Settings() {
  const { can } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-950">Settings</h1>
        <p className="text-ink-700/70 text-sm mt-1">Configure your company, team, and lookup lists.</p>
      </div>
      <div className="flex gap-2 border-b border-line-light overflow-x-auto">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === i ? 'border-brass text-ink-950' : 'border-transparent text-ink-700/60 hover:text-ink-950'}`}>{t}</button>
        ))}
      </div>
      {tab === 0 && <CompanyTab />}
      {tab === 1 && can('users.manage') && <UsersTab />}
      {tab === 2 && <LookupTab api={lookupsApi.taxRates} fields={[{ name: 'name', label: 'Name' }, { name: 'rate', label: 'Rate %', type: 'number' }]} />}
      {tab === 3 && <LookupTab api={lookupsApi.paymentMethods} fields={[{ name: 'name', label: 'Method name' }]} />}
      {tab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-display text-lg mb-3">Transaction categories</h3>
            <LookupTab api={lookupsApi.transactionCategories} fields={[{ name: 'name', label: 'Category name' }, { name: 'type', label: 'Type', type: 'select', options: ['income', 'expense'] }]} />
          </div>
          <div>
            <h3 className="font-display text-lg mb-3">Item categories & units</h3>
            <div className="space-y-4">
              <LookupTab api={lookupsApi.itemCategories} fields={[{ name: 'name', label: 'Category name' }]} />
              <LookupTab api={lookupsApi.itemUnits} fields={[{ name: 'name', label: 'Unit name' }]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

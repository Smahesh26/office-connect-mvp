import { useEffect, useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { itemsApi, lookupsApi } from '../api/endpoints';
import { Card, Modal, EmptyState, Th, Td } from '../components/ui/Primitives';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const empty = { name: '', sku: '', type: 'product', sale_price: 0, purchase_price: 0, description: '', category_id: '', unit_id: '', tax_id: '' };

export default function Items() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => itemsApi.list().then((res) => setRows(res.data));

  useEffect(() => {
    load();
    lookupsApi.itemCategories.list().then((res) => setCategories(res.data));
    lookupsApi.itemUnits.list().then((res) => setUnits(res.data));
    lookupsApi.taxRates.list().then((res) => setTaxRates(res.data));
  }, []);

  const openCreate = () => { setForm(empty); setEditingId(null); setModalOpen(true); };
  const openEdit = (it) => { setForm(it); setEditingId(it.id); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, category_id: form.category_id || null, unit_id: form.unit_id || null, tax_id: form.tax_id || null };
    if (editingId) await itemsApi.update(editingId, payload);
    else await itemsApi.create(payload);
    setModalOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Items</h1>
          <p className="text-ink-700/70 text-sm mt-1">Products and services you sell.</p>
        </div>
        {can('items.create') && <button className="btn-brass" onClick={openCreate}><Plus className="w-4 h-4" /> New item</button>}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Package} title="No items yet" description="Add products or services to speed up invoice creation." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead><tr className="border-b border-line-light"><Th>Name</Th><Th>SKU</Th><Th>Type</Th><Th align="right">Sale price</Th><Th align="right"></Th></tr></thead>
              <tbody className="divide-y divide-line-light">
                {rows.map((it) => (
                  <tr key={it.id} className="hover:bg-ink-950/[0.02]">
                    <Td className="font-medium">{it.name}</Td>
                    <Td className="text-ink-700/70">{it.sku || '—'}</Td>
                    <Td className="capitalize text-ink-700/70">{it.type}</Td>
                    <Td align="right" className="num">{formatMoney(it.sale_price)}</Td>
                    <Td align="right"><button className="text-xs text-brass-dark hover:underline" onClick={() => openEdit(it)}>Edit</button></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit item' : 'New item'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Name *</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">SKU</label><input className="input" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="product">Product</option><option value="service">Service</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Sale price</label><input type="number" step="0.01" className="input" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
            <div><label className="label">Purchase price</label><input type="number" step="0.01" className="input" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit_id || ''} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
                <option value="">—</option>{units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Default tax</label>
              <select className="input" value={form.tax_id || ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })}>
                <option value="">—</option>{taxRates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

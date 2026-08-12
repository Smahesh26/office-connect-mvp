import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '../../utils/format';

export default function LineItemsEditor({ items, setItems, items_catalog, taxRates, currencySymbol = '$' }) {
  const update = (idx, patch) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addRow = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_id: '' }]);
  const removeRow = (idx) => setItems(items.filter((_, i) => i !== idx));

  const pickCatalogItem = (idx, itemId) => {
    const found = items_catalog?.find((i) => i.id === itemId);
    if (found) {
      update(idx, { item_id: found.id, description: found.name, unit_price: found.sale_price, tax_id: found.tax_id || '' });
    }
  };

  const lineTotal = (it) => {
    const base = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const rate = taxRates?.find((t) => String(t.id) === String(it.tax_id))?.rate || 0;
    return base + base * (rate / 100);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-ink-700 px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Qty</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Tax</div>
        <div className="col-span-1 text-right">Total</div>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5 flex gap-1">
            {items_catalog?.length > 0 && (
              <select className="input !w-16 text-xs" value="" onChange={(e) => pickCatalogItem(idx, e.target.value)}>
                <option value="">+</option>
                {items_catalog.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
            <input className="input" placeholder="Item description" value={it.description} onChange={(e) => update(idx, { description: e.target.value })} required />
          </div>
          <input className="input col-span-2" type="number" step="0.01" min="0" value={it.quantity} onChange={(e) => update(idx, { quantity: e.target.value })} />
          <input className="input col-span-2" type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => update(idx, { unit_price: e.target.value })} />
          <select className="input col-span-2" value={it.tax_id || ''} onChange={(e) => update(idx, { tax_id: e.target.value })}>
            <option value="">No tax</option>
            {taxRates?.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
          </select>
          <div className="col-span-1 flex items-center justify-end gap-1">
            <span className="num text-sm">{formatMoney(lineTotal(it), currencySymbol)}</span>
            <button type="button" onClick={() => removeRow(idx)} className="text-ink-600/50 hover:text-ledger-rust"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addRow} className="btn-ghost text-xs !py-1.5"><Plus className="w-3.5 h-3.5" /> Add line</button>
    </div>
  );
}

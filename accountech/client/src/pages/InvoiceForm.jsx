import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoicesApi, customersApi, itemsApi, lookupsApi } from '../api/endpoints';
import { Card } from '../components/ui/Primitives';
import LineItemsEditor from '../components/documents/LineItemsEditor';
import { formatMoney } from '../utils/format';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);

  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, tax_id: '' }]);

  useEffect(() => {
    customersApi.list({ limit: 200 }).then((res) => setCustomers(res.data.data));
    itemsApi.list().then((res) => setCatalog(res.data));
    lookupsApi.taxRates.list().then((res) => setTaxRates(res.data));
  }, []);

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const taxTotal = items.reduce((s, it) => {
    const base = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const rate = taxRates.find((t) => String(t.id) === String(it.tax_id))?.rate || 0;
    return s + base * (rate / 100);
  }, 0);
  const discountTotal = discountType === 'percent' ? subtotal * ((Number(discountValue) || 0) / 100) : Number(discountValue) || 0;
  const total = subtotal - discountTotal + taxTotal;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        customer_id: customerId, invoice_date: invoiceDate, due_date: dueDate || null,
        notes, terms, discount_type: discountType, discount_value: discountValue, items,
      };
      const { data } = await invoicesApi.create(payload);
      navigate(`/invoices/${data.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-ink-950">New invoice</h1>
        <p className="text-ink-700/70 text-sm mt-1">Create a bill for your customer.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Customer *</label>
            <select required className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div><label className="label">Invoice date</label><input type="date" className="input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
          <div><label className="label">Due date</label><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
      </Card>

      <Card title="Line items">
        <LineItemsEditor items={items} setItems={setItems} items_catalog={catalog} taxRates={taxRates} />
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-700">Subtotal</span><span className="num">{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-700 flex items-center gap-2">
                Discount
                <select className="input !w-auto !py-1 text-xs" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                  <option value="fixed">$</option><option value="percent">%</option>
                </select>
                <input type="number" step="0.01" className="input !w-20 !py-1 text-xs" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              </span>
              <span className="num">-{formatMoney(discountTotal)}</span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-ink-700">Tax</span><span className="num">{formatMoney(taxTotal)}</span></div>
            <div className="flex justify-between ledger-total"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
        </div>
      </Card>

      <Card title="Notes & terms">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Notes (visible to customer)</label><textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div><label className="label">Terms</label><textarea className="input" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={() => navigate('/invoices')}>Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save invoice'}</button>
      </div>
    </form>
  );
}

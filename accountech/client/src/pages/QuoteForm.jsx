import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotesApi, customersApi, itemsApi, lookupsApi } from '../api/endpoints';
import { Card } from '../components/ui/Primitives';
import LineItemsEditor from '../components/documents/LineItemsEditor';
import { formatMoney } from '../utils/format';

export default function QuoteForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
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
  const total = subtotal + taxTotal;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await quotesApi.create({ customer_id: customerId, quote_date: quoteDate, expiry_date: expiryDate || null, notes, terms, items });
      navigate(`/quotes/${data.id}`);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-ink-950">New quote</h1>
        <p className="text-ink-700/70 text-sm mt-1">Send an estimate before the work begins.</p>
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
          <div><label className="label">Quote date</label><input type="date" className="input" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></div>
          <div><label className="label">Expires</label><input type="date" className="input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
        </div>
      </Card>

      <Card title="Line items">
        <LineItemsEditor items={items} setItems={setItems} items_catalog={catalog} taxRates={taxRates} />
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-700">Subtotal</span><span className="num">{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-ink-700">Tax</span><span className="num">{formatMoney(taxTotal)}</span></div>
            <div className="flex justify-between ledger-total"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
        </div>
      </Card>

      <Card title="Notes & terms">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Notes</label><textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div><label className="label">Terms</label><textarea className="input" rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={() => navigate('/quotes')}>Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save quote'}</button>
      </div>
    </form>
  );
}

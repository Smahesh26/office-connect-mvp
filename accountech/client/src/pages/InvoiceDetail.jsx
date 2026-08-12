import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Send, CheckCircle2, Trash2 } from 'lucide-react';
import { invoicesApi, transactionsApi, accountsApi, lookupsApi } from '../api/endpoints';
import { Card, StatusStamp, Modal, Th, Td } from '../components/ui/Primitives';
import { formatMoney, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [methods, setMethods] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [payAccount, setPayAccount] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const load = () => invoicesApi.get(id).then((res) => {
    setInvoice(res.data);
    setPayAmount(res.data.amount_due);
  });

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    accountsApi.list().then((res) => { setAccounts(res.data); setPayAccount(res.data.find((a) => a.code === '1010')?.id || res.data[0]?.id || ''); });
    lookupsApi.paymentMethods.list().then((res) => setMethods(res.data));
  }, []);

  if (!invoice) return <p className="text-ink-700">Loading…</p>;

  const setStatus = async (status) => { await invoicesApi.setStatus(id, status); load(); };

  const recordPayment = async (e) => {
    e.preventDefault();
    await transactionsApi.create({
      type: 'income', account_id: payAccount, payment_method_id: payMethod || null,
      invoice_id: id, customer_id: invoice.customer_id, amount: payAmount,
      description: `Payment for ${invoice.invoice_number}`,
    });
    setPayModalOpen(false);
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/invoices" className="text-sm text-brass-dark hover:underline">&larr; Invoices</Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="font-display text-3xl text-ink-950">{invoice.invoice_number}</h1>
            <StatusStamp status={invoice.status} />
          </div>
          <p className="text-ink-700/70 text-sm mt-1">{invoice.customer_name} &middot; Due {formatDate(invoice.due_date)}</p>
        </div>
        <div className="flex gap-2">
          <a href={invoicesApi.pdfUrl(id)} target="_blank" rel="noreferrer" className="btn-ghost"><Download className="w-4 h-4" /> PDF</a>
          {invoice.status === 'draft' && can('invoices.send') && (
            <button className="btn-ghost" onClick={() => setStatus('sent')}><Send className="w-4 h-4" /> Mark sent</button>
          )}
          {invoice.amount_due > 0 && can('transactions.create') && (
            <button className="btn-brass" onClick={() => setPayModalOpen(true)}><CheckCircle2 className="w-4 h-4" /> Record payment</button>
          )}
        </div>
      </div>

      <Card>
        <table className="w-full">
          <thead><tr className="border-b border-line-light"><Th>Description</Th><Th align="right">Qty</Th><Th align="right">Price</Th><Th align="right">Tax</Th><Th align="right">Total</Th></tr></thead>
          <tbody className="divide-y divide-line-light">
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <Td>{it.description}</Td>
                <Td align="right" className="num">{it.quantity}</Td>
                <Td align="right" className="num">{formatMoney(it.unit_price, invoice.currency_symbol)}</Td>
                <Td align="right" className="num">{formatMoney(it.tax_amount, invoice.currency_symbol)}</Td>
                <Td align="right" className="num">{formatMoney(it.total, invoice.currency_symbol)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-ink-700">Subtotal</span><span className="num">{formatMoney(invoice.subtotal, invoice.currency_symbol)}</span></div>
            {Number(invoice.discount_total) > 0 && <div className="flex justify-between text-sm"><span className="text-ink-700">Discount</span><span className="num">-{formatMoney(invoice.discount_total, invoice.currency_symbol)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-ink-700">Tax</span><span className="num">{formatMoney(invoice.tax_total, invoice.currency_symbol)}</span></div>
            <div className="flex justify-between ledger-total"><span>Total</span><span>{formatMoney(invoice.total, invoice.currency_symbol)}</span></div>
            <div className="flex justify-between text-sm text-ledger-green"><span>Paid</span><span className="num">{formatMoney(invoice.amount_paid, invoice.currency_symbol)}</span></div>
            <div className="flex justify-between text-sm font-semibold text-ledger-rust"><span>Balance due</span><span className="num">{formatMoney(invoice.amount_due, invoice.currency_symbol)}</span></div>
          </div>
        </div>
      </Card>

      {invoice.payments?.length > 0 && (
        <Card title="Payment history">
          <div className="divide-y divide-line-light -mx-5">
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex justify-between px-5 py-2 text-sm">
                <span className="text-ink-700/70">{formatDate(p.transaction_date)} &middot; {p.description}</span>
                <span className="num text-ledger-green">{formatMoney(p.amount, invoice.currency_symbol)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(invoice.notes || invoice.terms) && (
        <Card>
          {invoice.notes && <div className="mb-3"><p className="label">Notes</p><p className="text-sm">{invoice.notes}</p></div>}
          {invoice.terms && <div><p className="label">Terms</p><p className="text-sm">{invoice.terms}</p></div>}
        </Card>
      )}

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Record a payment">
        <form onSubmit={recordPayment} className="space-y-4">
          <div><label className="label">Amount</label><input type="number" step="0.01" className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required /></div>
          <div>
            <label className="label">Deposit to account</label>
            <select className="input" value={payAccount} onChange={(e) => setPayAccount(e.target.value)} required>
              {accounts.filter((a) => a.type === 'asset').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payment method</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="">—</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setPayModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Record payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

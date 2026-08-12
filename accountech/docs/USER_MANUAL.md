# AccounTech — User Manual

A guide to using your accounting and invoicing system day to day. No technical knowledge
required.

---

## 1. Signing in

Go to your company's AccounTech web address (given to you by whoever set up your account) and
enter your email and password. If you forget your password, ask an administrator on your team
to reset it for you from **Settings → Users & Roles**.

**First time logging in as the administrator?** Use the email and temporary password you were
given during setup, then go to your account menu and change your password right away.

---

## 2. The Dashboard

The Dashboard is what you see first. It gives you an at-a-glance view of your business:

- **Income this month** and **Expenses this month** — money in and out, so far this month.
- **Cash balance** — the total across your bank/cash accounts right now.
- **Overdue** — the total value of invoices that are past their due date and still unpaid.
- **Cash flow chart** — income vs. expenses over the last six months.
- **Recent invoices** — your latest invoices and their status.
- **Top customers** — who you've billed the most.

---

## 3. Customers

**Customers** are the people or companies you invoice. Go to **Customers** in the sidebar.

- **Add a customer**: click *New customer*, fill in their name (required) and any contact/
  billing details you have, then *Save*.
- **Edit a customer**: click *Edit* next to their row.
- **View a customer**: click their name to see their contact details and recent invoices,
  and the total they currently owe you (*Outstanding*).
- **Search**: use the search box to find a customer by name or email.

---

## 4. Items (Products & Services)

**Items** are the things you sell — products or services — that you can quickly add to
invoices and quotes instead of typing them out every time. Go to **Items** in the sidebar.

- **Add an item**: click *New item*, give it a name and sale price, and optionally a SKU,
  category, unit (e.g. "hrs", "pcs"), and a default tax rate.
- When you add a line to an invoice or quote later, you can pick from your saved items and
  the description, price, and tax will fill in automatically — you can still edit them per
  invoice if needed.

---

## 5. Chart of Accounts

The **Chart of Accounts** is the list of "buckets" your money moves through — bank accounts,
cash, revenue categories, expense categories, and so on. A starter set is created for you
automatically (Business Bank Account, Cash on Hand, Sales Revenue, Rent Expense, etc.), and
you can add more from **Chart of Accounts → New account**.

Each account shows its **current balance**, which updates automatically every time you record
a transaction or a payment against it — you never need to update balances by hand.

You generally won't need to touch this section often once it's set up, but it's worth
understanding: every invoice payment and every expense you record has to be tied to one of
these accounts (usually your bank account), which is what makes your cash balance and reports
accurate.

---

## 6. Quotes (Estimates)

Send a **Quote** before you start work, so the customer can approve the price up front.

1. **Quotes → New quote**.
2. Choose the **customer**, set the quote date and an optional expiry date.
3. Add **line items** — either pick a saved Item or type a description, then set quantity,
   price, and tax.
4. Add any **notes** (visible to the customer) or **terms**, then **Save quote**.
5. From the quote's page you can:
   - **Download PDF** — a polished, print-ready document to send to your customer.
   - **Mark sent** once you've emailed or delivered it.
   - **Mark accepted** once the customer agrees.
   - **Convert to invoice** — turns an accepted quote into a real invoice with one click,
     copying over the customer, line items, and totals so you don't retype anything.

---

## 7. Invoices

An **Invoice** is a formal bill. Go to **Invoices → New invoice**.

1. Choose the **customer**, invoice date, and due date.
2. Add **line items** the same way as a quote.
3. Optionally add a **discount** (as a fixed amount or a percentage), notes, and terms.
4. **Save invoice** — it starts as a **Draft**, which you can still freely edit.
5. Once it's ready, open it and click **Mark sent**.

### Invoice statuses
| Status | Meaning |
|---|---|
| Draft | Still being prepared; not yet sent to the customer |
| Sent | Delivered to the customer, awaiting payment |
| Viewed | The customer has opened it (if you track this) |
| Partial | Some, but not all, of the total has been paid |
| Paid | Fully paid — nothing more owed |
| Overdue | Past the due date and still not fully paid |
| Cancelled | Voided; no longer collectable |

### Recording a payment
When a customer pays you (in full or in part):
1. Open the invoice.
2. Click **Record payment**.
3. Enter the amount, choose which account the money was deposited into (e.g. your bank
   account), and optionally the payment method (cash, bank transfer, card, etc.).
4. Save — the invoice's *Paid* and *Balance due* amounts update immediately, its status
   changes to **Partial** or **Paid** automatically, and the account balance you deposited into
   goes up by that amount. Nothing else needs to be done by hand.

### Getting paid documents to your customer
Click **PDF** on any invoice or quote to open a print-ready, professionally formatted document
you can download, print, or attach to an email.

---

## 8. Transactions (Income & Expenses)

Not every dollar in or out of your business comes from an invoice — rent, software
subscriptions, and other day-to-day expenses also need to be recorded so your books stay
accurate. Go to **Transactions**.

1. Click **New transaction**.
2. Choose **Income** or **Expense**.
3. Enter the **amount**, the **account** it affects (usually your bank account), and
   optionally a **category** (e.g. "Rent", "Software & Subscriptions") and **payment method**.
4. Add a date and description, then save.

Every transaction immediately updates the balance of the account it's tied to, and rolls up
into your Dashboard and Reports. You can filter the transaction list by Income/Expense using
the buttons at the top, and delete a transaction if you made a mistake (this automatically
reverses its effect on the account balance and on any invoice it was linked to).

---

## 9. Reports

Go to **Reports** for three views into your finances:

- **Profit & Loss** — total income, total expenses, and net profit over time, broken down by
  category (e.g. how much of your expense total was Rent vs. Software).
- **Invoice Aging** — how much money is owed to you, grouped by how overdue it is (current,
  1–30 days late, 31–60, 61–90, 90+). This is the fastest way to see who you need to follow
  up with.
- **Sales by Customer** — total billed and total paid, per customer, so you can see who your
  best customers are and who's slow to pay.

---

## 10. Settings

Go to **Settings** (visible items depend on your role):

- **Company** — your business name, address, contact details, invoice/quote numbering
  prefixes, and default payment terms shown on new documents.
- **Users & Roles** *(administrators only)* — invite teammates, assign them a role
  (Admin, Accountant, or Staff — see below), and deactivate anyone who leaves.
- **Tax Rates** — the tax percentages available when adding line items to invoices/quotes.
- **Payment Methods** — the list you choose from when recording a payment (Cash, Bank
  Transfer, Card, etc.) — add your own if you need one that isn't listed.
- **Categories** — categories for classifying transactions (e.g. "Consulting Income",
  "Marketing"), and categories/units for items (e.g. "Software", "hrs").

### Roles, and what each can do
| Role | Can do |
|---|---|
| **Admin** | Everything, including managing users and company settings |
| **Accountant** | Full invoicing/quoting/transactions/accounts/reports access, but can't manage users or company settings |
| **Staff** | Can view and create invoices, quotes, and customers, but can't edit financial records, see reports, or manage settings |

If someone on your team needs different access than these three roles allow, ask your
developer/administrator — the permission system supports finer-grained access than what's
exposed in the current settings screen.

---

## 11. Everyday workflows, start to finish

**Billing a new customer for a one-off job:**
Customers → New customer → fill in details → Save.
Invoices → New invoice → pick the customer → add line items → Save → open it → Mark sent →
download the PDF and email it → when they pay, open the invoice → Record payment.

**Quoting a job before you commit to it:**
Quotes → New quote → fill in details → Save → download the PDF and send it → once the
customer agrees, open the quote → Mark accepted → Convert to invoice.

**Logging a business expense (e.g. paying for software):**
Transactions → New transaction → Expense → enter the amount, account, and category → Save.

**Checking who owes you money:**
Reports → Invoice Aging tab — anyone in the "31-60" bucket or beyond is worth following up
with directly.

---

## 12. Getting help

If something looks wrong (a balance that doesn't add up, a page that won't load), your first
stop should be whoever manages/hosts AccounTech for your organization — they have access to
technical logs that can pinpoint the issue quickly. This manual covers day-to-day use; the
companion **Developer Manual** covers setup, hosting, and technical troubleshooting.

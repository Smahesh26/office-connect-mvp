const PDFDocument = require('pdfkit');

/**
 * Streams a premium-styled invoice/quote PDF directly to the HTTP response.
 * `doc` = invoice or quote row, `items` = line items, `company`, `customer` rows.
 */
function renderDocumentPdf(res, { doc, items, company, customer, currencySymbol, docLabel }) {
  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.invoice_number || doc.quote_number}.pdf"`);
  pdf.pipe(res);

  const accent = '#4f46e5';
  const number = doc.invoice_number || doc.quote_number;

  // Header
  pdf.fillColor(accent).fontSize(22).font('Helvetica-Bold').text(company.name, 50, 50);
  pdf.fillColor('#111827').fontSize(10).font('Helvetica')
    .text(company.address || '', 50, 78)
    .text([company.city, company.state, company.zip].filter(Boolean).join(', '), 50, 92)
    .text(company.email || '', 50, 106);

  pdf.fillColor(accent).fontSize(26).font('Helvetica-Bold').text(docLabel.toUpperCase(), 300, 50, { align: 'right' });
  pdf.fillColor('#111827').fontSize(10).font('Helvetica')
    .text(`Number: ${number}`, 300, 82, { align: 'right' })
    .text(`Date: ${new Date(doc.invoice_date || doc.quote_date).toDateString()}`, 300, 96, { align: 'right' })
    .text(`Due/Expiry: ${doc.due_date || doc.expiry_date ? new Date(doc.due_date || doc.expiry_date).toDateString() : '-'}`, 300, 110, { align: 'right' });

  pdf.moveTo(50, 140).lineTo(545, 140).strokeColor('#e5e7eb').stroke();

  // Bill To
  pdf.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 155);
  pdf.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(customer.display_name, 50, 170);
  pdf.font('Helvetica').fontSize(10)
    .text(customer.billing_address || '', 50, 186)
    .text(customer.email || '', 50, 200);

  // Table header
  let y = 240;
  pdf.rect(50, y, 495, 22).fill('#f3f4f6');
  pdf.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
  pdf.text('DESCRIPTION', 58, y + 7);
  pdf.text('QTY', 320, y + 7, { width: 40, align: 'right' });
  pdf.text('PRICE', 370, y + 7, { width: 60, align: 'right' });
  pdf.text('TAX', 435, y + 7, { width: 50, align: 'right' });
  pdf.text('TOTAL', 490, y + 7, { width: 55, align: 'right' });
  y += 30;

  pdf.font('Helvetica').fontSize(10).fillColor('#111827');
  items.forEach((it) => {
    pdf.text(it.description, 58, y, { width: 250 });
    pdf.text(String(it.quantity), 320, y, { width: 40, align: 'right' });
    pdf.text(`${currencySymbol}${Number(it.unit_price).toFixed(2)}`, 370, y, { width: 60, align: 'right' });
    pdf.text(`${currencySymbol}${Number(it.tax_amount).toFixed(2)}`, 435, y, { width: 50, align: 'right' });
    pdf.text(`${currencySymbol}${Number(it.total).toFixed(2)}`, 490, y, { width: 55, align: 'right' });
    y += 22;
  });

  y += 10;
  pdf.moveTo(320, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 10;

  const line = (label, value, bold = false) => {
    pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
    pdf.text(label, 320, y, { width: 130, align: 'right' });
    pdf.text(`${currencySymbol}${Number(value).toFixed(2)}`, 460, y, { width: 85, align: 'right' });
    y += bold ? 22 : 18;
  };

  line('Subtotal', doc.subtotal);
  if (Number(doc.discount_total) > 0) line('Discount', -doc.discount_total);
  line('Tax', doc.tax_total);
  line('Total', doc.total, true);
  if (doc.amount_paid !== undefined) {
    line('Paid', doc.amount_paid);
    line('Balance Due', doc.amount_due, true);
  }

  if (doc.notes) {
    y += 20;
    pdf.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('NOTES', 50, y);
    pdf.fillColor('#111827').fontSize(10).font('Helvetica').text(doc.notes, 50, y + 14, { width: 495 });
  }

  pdf.end();
}

module.exports = { renderDocumentPdf };

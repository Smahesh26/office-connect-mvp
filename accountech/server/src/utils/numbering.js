/**
 * Atomically claims the next invoice or quote number for a company.
 * Must be called inside a transaction using the same `client`.
 */
async function nextDocumentNumber(client, companyId, docType) {
  const column = docType === 'invoice' ? 'next_invoice_no' : 'next_quote_no';
  const prefixColumn = docType === 'invoice' ? 'invoice_prefix' : 'quote_prefix';

  const { rows } = await client.query(
    `SELECT ${column} AS next_no, ${prefixColumn} AS prefix
     FROM companies WHERE id = $1 FOR UPDATE`,
    [companyId]
  );
  const { next_no: nextNo, prefix } = rows[0];

  await client.query(`UPDATE companies SET ${column} = ${column} + 1 WHERE id = $1`, [companyId]);

  const number = `${prefix}${String(nextNo).padStart(5, '0')}`;
  return number;
}

module.exports = { nextDocumentNumber };

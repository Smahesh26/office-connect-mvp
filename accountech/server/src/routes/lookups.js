const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { crudFactory } = require('../utils/crudFactory');

const router = express.Router();
router.use(requireAuth);

function mount(path, table, fields, permissionPrefix) {
  const c = crudFactory(table, fields);
  router.get(`/${path}`, c.list);
  router.post(`/${path}`, requirePermission(`${permissionPrefix}.create`), c.create);
  router.put(`/${path}/:id`, requirePermission(`${permissionPrefix}.edit`), c.update);
  router.delete(`/${path}/:id`, requirePermission(`${permissionPrefix}.delete`), c.remove);
}

mount('tax-rates', 'tax_rates', ['name', 'rate', 'is_compound', 'is_active'], 'accounts');
mount('payment-methods', 'payment_methods', ['name', 'is_active'], 'accounts');
mount('transaction-categories', 'transaction_categories', ['name', 'type'], 'accounts');
mount('item-categories', 'item_categories', ['name'], 'items');
mount('item-units', 'item_units', ['name'], 'items');
mount('currencies', 'currencies', ['code', 'name', 'symbol', 'decimal_places', 'exchange_rate', 'is_default'], 'settings');

module.exports = router;

import api from './client';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  ssoLogin: (token) => api.post('/auth/sso', { token }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const itemsApi = {
  list: (params) => api.get('/items', { params }),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  remove: (id) => api.delete(`/items/${id}`),
};

export const accountsApi = {
  list: () => api.get('/accounts'),
  get: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  remove: (id) => api.delete(`/accounts/${id}`),
};

export const invoicesApi = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  setStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  remove: (id) => api.delete(`/invoices/${id}`),
  pdfUrl: (id) => `/api/invoices/${id}/pdf`,
};

export const quotesApi = {
  list: (params) => api.get('/quotes', { params }),
  get: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  setStatus: (id, status) => api.patch(`/quotes/${id}/status`, { status }),
  convert: (id) => api.post(`/quotes/${id}/convert`),
  remove: (id) => api.delete(`/quotes/${id}`),
  pdfUrl: (id) => `/api/quotes/${id}/pdf`,
};

export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const lookupsApi = {
  taxRates: {
    list: () => api.get('/tax-rates'),
    create: (data) => api.post('/tax-rates', data),
    update: (id, data) => api.put(`/tax-rates/${id}`, data),
    remove: (id) => api.delete(`/tax-rates/${id}`),
  },
  paymentMethods: {
    list: () => api.get('/payment-methods'),
    create: (data) => api.post('/payment-methods', data),
  },
  transactionCategories: {
    list: () => api.get('/transaction-categories'),
    create: (data) => api.post('/transaction-categories', data),
  },
  itemCategories: {
    list: () => api.get('/item-categories'),
    create: (data) => api.post('/item-categories', data),
  },
  itemUnits: {
    list: () => api.get('/item-units'),
    create: (data) => api.post('/item-units', data),
  },
  currencies: {
    list: () => api.get('/currencies'),
    create: (data) => api.post('/currencies', data),
  },
};

export const usersApi = {
  list: () => api.get('/users'),
  roles: () => api.get('/users/roles'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
  remove: (id) => api.delete(`/users/${id}`),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

export const reportsApi = {
  profitAndLoss: (params) => api.get('/reports/profit-and-loss', { params }),
  invoiceAging: () => api.get('/reports/invoice-aging'),
  salesByCustomer: () => api.get('/reports/sales-by-customer'),
};

export const companyApi = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data),
};

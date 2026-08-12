const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const itemRoutes = require('./routes/items');
const accountRoutes = require('./routes/accounts');
const invoiceRoutes = require('./routes/invoices');
const quoteRoutes = require('./routes/quotes');
const transactionRoutes = require('./routes/transactions');
const lookupRoutes = require('./routes/lookups');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const companyRoutes = require('./routes/company');
const webhookRoutes = require('./routes/webhooks');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// General API rate limit; login has its own tighter limit inside authController's route if desired.
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/webhooks', webhookRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', lookupRoutes); // /api/tax-rates, /api/payment-methods, etc.
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/company', companyRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

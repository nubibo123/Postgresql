const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const adminRoutes = require('./routes/adminRoutes');
const loanRoutes = require('./routes/loanRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cardRoutes = require('./routes/cardRoutes');
const billRoutes = require('./routes/billRoutes');
const scheduledRoutes = require('./routes/scheduledRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SecureBank API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/scheduled', scheduledRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

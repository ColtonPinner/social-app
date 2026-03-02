require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);

app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';

const app = express();
app.use(cors());
app.use(express.json()); // lets us read JSON request bodies

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);

// Catches any error thrown in a route
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
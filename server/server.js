import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import userRoutes from './routes/users.js';
import typeRoutes from './routes/types.js';
import officeRoutes from './routes/offices.js';
import inwardRoutes from './routes/inwards.js';
import outwardRoutes from './routes/outwards.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';
import cron from 'node-cron';
import notificationRoutes from './routes/notifications.js';
import { runReminders } from './jobs/reminders.js';

const app = express();
app.use(cors());
app.use(express.json()); // lets us read JSON request bodies

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/types', typeRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/inwards', inwardRoutes);
app.use('/api/outwards', outwardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Catches any error thrown in a route
app.use((err, req, res, next) => {
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: 'That name already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

    // Every day at 9:00 AM India time
    cron.schedule(
        '0 9 * * *',
        () => {
            runReminders().then((r) => console.log('Reminders sent', r)).catch(console.error);
        },
        { timezone: 'Asia/Kolkata' }
    );
});
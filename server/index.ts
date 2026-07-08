import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDb } from './db';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start DB connection & then start listening
const startServer = async () => {
  try {
    await initializeDb();
    app.listen(PORT, () => {
      console.log(`Express server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start database/server:', error);
    process.exit(1);
  }
};

startServer();

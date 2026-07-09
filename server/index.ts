import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDb } from './db';
import authRouter from './routes/auth';
import statementsRouter from './routes/statements';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' })); // support large PDF base64 payloads

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', authRouter);
app.use('/api', statementsRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Error Handler caught error:", err);
  res.status(500).json({ message: err.message || "Internal server error." });
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

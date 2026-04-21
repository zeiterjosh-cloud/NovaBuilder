import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import projectRoutes from './routes/projects.js';
import deployRoutes from './routes/deploy.js';
import stripeRoutes from './routes/stripe.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

// Stripe webhook needs raw body
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// Routes with rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/generate', generateLimiter, generateRoutes);
app.use('/projects', apiLimiter, projectRoutes);
app.use('/deploy', apiLimiter, deployRoutes);
app.use('/stripe', apiLimiter, stripeRoutes);

// Serve deployed projects
app.use('/deployed', express.static(path.join(__dirname, '../storage/deployed')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`NovaBuilder backend running on port ${PORT}`);
});

export default app;

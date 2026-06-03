import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { attachAuthUser } from './lib/authGuard';

import { setGlobalDispatcher, Agent as UndiciAgent } from 'undici';
import billingRouter from './api/billing';

// Load environment variables
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || (process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env'),
});

// Configure global undici agent with 15-minute headers timeout
setGlobalDispatcher(new UndiciAgent({
  headersTimeout: 900000, // 15 minutes
  bodyTimeout: 900000,
  connect: { timeout: 60000 }
}));

const app = express();
const PORT = process.env.PORT || 8080;
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
}));

// Polar webhooks need the untouched raw JSON body for signature verification.
app.use('/api/billing', billingRouter);

app.use(express.json());
app.use(attachAuthUser);

// Routes (with summarizer)
import shortenerRouter from './api/tools/shortener';
import qrcodeRouter from './api/tools/qrcode';
import metatagsRouter from './api/tools/metatags';
import linkPreviewRouter from './api/tools/linkpreview';
import summarizeRouter from './api/tools/summarize';
import crossArticleRouter from './api/tools/crossArticle';
import coverletterRouter from './api/tools/coverletter';
import interviewPrepRouter from './api/tools/interviewPrep';
import resumeRouter from './api/tools/resume';
import brandRouter from './api/tools/brand';
import seoRouter from './api/tools/seo';
import studyNotesRouter from './api/tools/studynotes';
import presentationRouter from './api/tools/presentation';
import transcribeRouter from './api/tools/transcribe';
import utmRouter from './api/tools/utm';
import cleanerRouter from './api/tools/cleaner';
import tasksRouter from './api/tasks';
import exportRouter from './api/export';
import resumeProfileRouter from './api/resumeProfile';
import creditsRouter from './api/credits';

// API endpoints
app.use('/api/tools', shortenerRouter); 
app.use('/api/tools', qrcodeRouter); 
app.use('/api/tools', metatagsRouter); 
app.use('/api/tools', linkPreviewRouter);
app.use('/api/tools', summarizeRouter); 
app.use('/api/tools', crossArticleRouter);
app.use('/api/tools', coverletterRouter); 
app.use('/api/tools', interviewPrepRouter);
app.use('/api/tools', resumeRouter); 
app.use('/api/tools', brandRouter); 
app.use('/api/tools', seoRouter);
app.use('/api/tools', studyNotesRouter);
app.use('/api/tools', presentationRouter);
app.use('/api/tools', transcribeRouter);
app.use('/api/tools', utmRouter);
app.use('/api/tools', cleanerRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/export', exportRouter);
app.use('/api/resume-profile', resumeProfileRouter);
app.use('/api/credits', creditsRouter);

// Basic health check route must be registered before the root short-link route.
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Short-domain smoke test. Useful after pointing ilvu.site to this backend.
app.get('/__shortener/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'iloveurl-shortener',
    shortUrlBase: process.env.SHORT_URL_BASE || null,
    host: req.get('host'),
    timestamp: new Date().toISOString(),
  });
});

app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).send();
});

// API catch-all: unknown API routes should not fall through to short-link redirects.
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
  });
});

// Redirection routes
// We mount at /s for iloveurl.space/s/slug
app.use('/s', shortenerRouter); 
// We also mount at root / for ilvu.site/slug
app.use('/', shortenerRouter); 

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Core API Gateway is running on port ${PORT}`);
});

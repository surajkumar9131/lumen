import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import './lib/firebase.js';

import { openApiSpec } from './swagger.js';
import { authMiddleware } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { booksRouter } from './routes/books.js';
import { foldersRouter } from './routes/folders.js';
import { snippetsRouter } from './routes/snippets.js';
import { searchRouter } from './routes/search.js';
import { exportRouter } from './routes/export.js';
import { aiRouter } from './routes/ai.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
// 0.0.0.0 = accept connections from any network interface (phone, tablet, etc.)
const HOST = process.env.HOST ?? '0.0.0.0';

app.use(cors());
app.use(express.json());

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lumen-api' });
});

// Auth (signup = public, me = protected)
app.use('/api/auth', authRouter);

// Protected API routes
app.use('/api/books', authMiddleware, booksRouter);
app.use('/api/folders', authMiddleware, foldersRouter);
app.use('/api/snippets', authMiddleware, snippetsRouter);
app.use('/api/search', authMiddleware, searchRouter);
app.use('/api/export', authMiddleware, exportRouter);
app.use('/api/ai', authMiddleware, aiRouter);

app.listen(PORT, HOST, () => {
  console.log(`Lumen API running at http://localhost:${PORT}`);
  if (HOST === '0.0.0.0') {
    console.log(`Reachable from network - use your computer IP (e.g. http://192.168.x.x:${PORT}) for EXPO_PUBLIC_API_URL on device`);
  }
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

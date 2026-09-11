import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/index';

const app = express();
const PORT = 3000;

// Core Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    architecture: 'MVC',
    framework: 'Express + TypeScript',
    timestamp: new Date().toISOString(),
  });
});

// Mount MVC API Routes
app.use('/api/v1', apiRouter);

// Start Server with Vite or Static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Placemein CRA Backend] MVC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

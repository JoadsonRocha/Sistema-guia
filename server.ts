import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || '2mb';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://www.nexuspolitica.com.br,https://nexuspolitica.com.br,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: NODE_ENV,
    release: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    tracesSampleRate: 0.2,
  });
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600';

app.disable('x-powered-by');
app.disable('etag');
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

if (process.env.SENTRY_DSN) {
  // Sentry >= v8 automatically instruments requests, Handlers.requestHandler is removed.
}

// ==============================================================================
// MIDDLEWARE DE SEGURANÇA HTTP & HARDENING (HELMET & CORS STRICTIONS)
// ==============================================================================
app.use((req, res, next) => {
  // Cabeçalhos de Proteção HTTP
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=(self)');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self';");
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Configuração estrita de CORS
  const origin = req.headers.origin;
  const isAllowedOrigin = Boolean(origin && ALLOWED_ORIGINS.some((allowedOrigin) => {
    if (allowedOrigin.includes('*')) {
      return origin.startsWith(allowedOrigin.replace('*', ''));
    }
    return origin === allowedOrigin;
  }));

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }

  if (req.path.startsWith('/health')) {
    return next();
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 2 * 1024 * 1024) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  next();
});

async function fetchCandidateInfoServer(coordId?: string): Promise<{ name: string; title: string; photoUrl: string }> {
  return {
    name: 'Nosso Candidato',
    title: 'Campanha Eleitoral',
    photoUrl: DEFAULT_PHOTO
  };
}

async function startServer() {
  let vite: any;

  try {
    if (NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
    }
  } catch (err) {
    console.error('Failed to create Vite server in middlewareMode:', err);
  }

  app.get('/health', (_req, res) => {
    res.status(200).send('ok');
  });

  // Rota com sanitização contra Path Traversal
  app.get('/download/arquitetura-doc', (req, res) => {
    const publicDir = path.resolve(process.cwd(), 'public');
    const filePath = path.resolve(publicDir, 'ARQUITETURA_E_REQUISITOS_NEXUS_POLITICA.doc');

    // Validação estrita de Path Traversal
    if (!filePath.startsWith(publicDir)) {
      return res.status(403).send('Acesso negado');
    }

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/msword; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ARQUITETURA_E_REQUISITOS_NEXUS_POLITICA.doc"');
      return res.sendFile(filePath);
    }
    return res.status(404).send('Arquivo não encontrado');
  });

  // HTML Intercept Middleware for Open Graph / WhatsApp Preview
  app.use((req, res, next) => {
    (async () => {
      if (req.method !== 'GET') return next();

      // Path traversal check on static routes
      if (req.path !== '/' && req.path !== '/index.html') {
        const publicDir = path.resolve(process.cwd(), 'public');
        const publicFile = path.resolve(publicDir, req.path.replace(/^\/+/, ''));
        if (publicFile.startsWith(publicDir) && fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) {
          return next();
        }
      }

      const accept = req.headers.accept || '';
      if (!accept.includes('text/html') && req.path !== '/' && !req.path.endsWith('.html')) {
        return next();
      }

      let template = '';
      if (vite) {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.url, template);
        }
      } else {
        const distIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');
        if (fs.existsSync(distIndexPath)) {
          template = fs.readFileSync(distIndexPath, 'utf-8');
        }
      }

      if (!template) return next();

      const coordId = (req.query.coordinatorId as string) || (req.query.leaderId as string) || undefined;
      const cand = await fetchCandidateInfoServer(coordId);

      // Inject candidate photo and text into Open Graph meta tags
      const ogTitle = `FAÇA PARTE DO NOSSO TIME! 🗳️ - ${cand.name}`;
      const ogDesc = `Faça parte do nosso time! Cadastre-se e apoie a campanha de ${cand.name} (${cand.title}).`;
      const ogPhoto = cand.photoUrl || DEFAULT_PHOTO;

      let html = template;
      html = html.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${ogTitle}"`);
      html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${ogDesc}"`);
      html = html.replace(/<meta property="og:image" content="[^"]*"/i, `<meta property="og:image" content="${ogPhoto}"`);

      html = html.replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${ogTitle}"`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${ogDesc}"`);
      html = html.replace(/<meta name="twitter:image" content="[^"]*"/i, `<meta name="twitter:image" content="${ogPhoto}"`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    })().catch((e) => {
      console.error('Error rendering HTML with candidate meta tags:', e);
      return next();
    });
  });

  if (vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
});

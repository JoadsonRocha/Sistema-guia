import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600';

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
  
  // Configuração estrita de CORS
  const allowedOrigins = [
    'https://www.nexuspolitica.com.br',
    'https://nexuspolitica.com.br',
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
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
    if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});

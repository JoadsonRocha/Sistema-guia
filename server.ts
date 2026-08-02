import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=600';

function getFirebaseConfig(): { projectId?: string; firestoreDatabaseId?: string } {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return {};
}

async function fetchCandidateInfoServer(coordId?: string): Promise<{ name: string; title: string; photoUrl: string }> {
  const result = {
    name: 'Nosso Candidato',
    title: 'Campanha Eleitoral',
    photoUrl: DEFAULT_PHOTO
  };

  try {
    const firebaseConfig = getFirebaseConfig();
    const projectId = firebaseConfig.projectId || 'sistema-aguia';
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';

    const tryFetchDoc = async (docName: string) => {
      try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/settings/${docName}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const fields = json?.fields || {};
          const name = fields.name?.stringValue;
          const title = fields.title?.stringValue;
          const photoUrl = fields.photoUrl?.stringValue;
          if (name) result.name = name;
          if (title) result.title = title;
          if (photoUrl) result.photoUrl = photoUrl;
          return true;
        }
      } catch (e) {
        // ignore fetch error
      }
      return false;
    };

    if (coordId) {
      const found = await tryFetchDoc(`candidate_${coordId.replace(/^coord_/, '')}`);
      if (found) return result;
    }

    await tryFetchDoc('candidate');
  } catch (e) {
    // catch all
  }
  return result;
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

  // HTML Intercept Middleware for Open Graph / WhatsApp Preview
  app.use((req, res, next) => {
    // Handle async logic cleanly to avoid unhandled rejections in Express
    (async () => {
      if (req.method !== 'GET') return next();
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


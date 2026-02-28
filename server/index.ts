import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type SubscriptionSource = 'newsletter' | 'downloads';

type SubscriberRow = {
  id: number;
  email: string;
  sources: string;
  createdAt: string;
  updatedAt: string;
};

type PdfRow = {
  id: number;
  title: string;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dataDir = process.env.DATA_DIR
  ? path.resolve(rootDir, process.env.DATA_DIR)
  : path.join(rootDir, 'data');
const dbPath = process.env.DB_PATH
  ? path.resolve(rootDir, process.env.DB_PATH)
  : path.join(dataDir, 'virtualchef.sqlite');
const port = Number(process.env.PORT || 8787);
const adminToken = process.env.ADMIN_TOKEN || '';
const corsOrigin = process.env.CORS_ORIGIN?.trim() || '*';

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 4000');
db.exec(`
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  sources TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pdf_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean) }));
app.use(express.json({ limit: '1mb' }));

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseSources(raw: string): SubscriptionSource[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is SubscriptionSource => value === 'newsletter' || value === 'downloads');
  } catch {
    return [];
  }
}

function ensureHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function getAdminTokenFromRequest(req: Request) {
  const headerToken = req.header('x-admin-token') || req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  return headerToken || queryToken;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!adminToken) {
    res.status(503).json({ error: 'ADMIN_TOKEN no configurado en servidor.' });
    return;
  }

  const token = getAdminTokenFromRequest(req);
  if (token !== adminToken) {
    res.status(401).json({ error: 'Token admin invalido.' });
    return;
  }

  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbPath });
});

app.post('/api/subscribers', (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ''));
  const source = String(req.body?.source || '') as SubscriptionSource;

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Email invalido.' });
    return;
  }

  if (source !== 'newsletter' && source !== 'downloads') {
    res.status(400).json({ error: 'Source invalido.' });
    return;
  }

  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT id, email, sources, created_at AS createdAt, updated_at AS updatedAt FROM subscribers WHERE email = ?')
    .get(email) as SubscriberRow | undefined;

  if (!existing) {
    db.prepare('INSERT INTO subscribers (email, sources, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      email,
      JSON.stringify([source]),
      now,
      now,
    );
    res.status(201).json({ ok: true, email });
    return;
  }

  const sources = parseSources(existing.sources);
  const nextSources = sources.includes(source) ? sources : [...sources, source];
  db.prepare('UPDATE subscribers SET sources = ?, updated_at = ? WHERE id = ?').run(
    JSON.stringify(nextSources),
    now,
    existing.id,
  );

  res.json({ ok: true, email });
});

app.get('/api/subscribers', requireAdmin, (req, res) => {
  const requestedLimit = Number(req.query.limit || 200);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 2000)) : 200;

  const rows = db
    .prepare('SELECT id, email, sources, created_at AS createdAt, updated_at AS updatedAt FROM subscribers ORDER BY updated_at DESC LIMIT ?')
    .all(limit) as SubscriberRow[];
  const totalRow = db.prepare('SELECT COUNT(*) AS total FROM subscribers').get() as { total: number };

  res.json({
    total: totalRow.total,
    items: rows.map((row) => ({
      ...row,
      sources: parseSources(row.sources),
    })),
  });
});

app.get('/api/subscribers/export', requireAdmin, (_req, res) => {
  const rows = db
    .prepare('SELECT email, sources, created_at AS createdAt, updated_at AS updatedAt FROM subscribers ORDER BY updated_at DESC')
    .all() as Array<{ email: string; sources: string; createdAt: string; updatedAt: string }>;

  const header = 'email,sources,created_at,updated_at';
  const csvLines = rows.map((row) => {
    const safeEmail = `"${row.email.replace(/"/g, '""')}"`;
    const safeSources = `"${parseSources(row.sources).join('|')}"`;
    const safeCreated = `"${row.createdAt}"`;
    const safeUpdated = `"${row.updatedAt}"`;
    return [safeEmail, safeSources, safeCreated, safeUpdated].join(',');
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="virtualchef-subscribers.csv"');
  res.send([header, ...csvLines].join('\n'));
});

app.get('/api/pdfs', (_req, res) => {
  const rows = db
    .prepare('SELECT id, title, description, url, created_at AS createdAt, updated_at AS updatedAt FROM pdf_resources ORDER BY updated_at DESC')
    .all() as PdfRow[];
  res.json({ items: rows });
});

app.post('/api/pdfs', requireAdmin, (req, res) => {
  const title = String(req.body?.title || '').trim();
  const description = String(req.body?.description || '').trim();
  const url = String(req.body?.url || '').trim();

  if (!title || !description || !url) {
    res.status(400).json({ error: 'title, description y url son obligatorios.' });
    return;
  }

  if (!ensureHttpUrl(url)) {
    res.status(400).json({ error: 'URL invalida. Debe empezar por http:// o https://.' });
    return;
  }

  const now = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO pdf_resources (title, description, url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(title, description, url, now, now);

  const row = db
    .prepare('SELECT id, title, description, url, created_at AS createdAt, updated_at AS updatedAt FROM pdf_resources WHERE id = ?')
    .get(result.lastInsertRowid) as PdfRow;

  res.status(201).json({ item: row });
});

app.delete('/api/pdfs/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'ID invalido.' });
    return;
  }

  const deleted = db.prepare('DELETE FROM pdf_resources WHERE id = ?').run(id);
  if (deleted.changes === 0) {
    res.status(404).json({ error: 'PDF no encontrado.' });
    return;
  }

  res.json({ ok: true });
});

const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`[virtualchef] API running on http://localhost:${port}`);
  console.log(`[virtualchef] SQLite DB: ${dbPath}`);
});

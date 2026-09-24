// Тонкая обёртка над публичным REST API n8n. Только стандартная библиотека Node.
// Переменные окружения: N8N_API_URL (например https://n8n.example.com), N8N_API_KEY.
import { readFileSync, existsSync } from 'node:fs';

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function config() {
  loadDotEnv();
  const url = process.env.N8N_API_URL?.replace(/\/+$/, '');
  const key = process.env.N8N_API_KEY;
  if (!url || !key) {
    console.error('Нужны N8N_API_URL и N8N_API_KEY (в окружении или в .env, см. .env.example)');
    process.exit(2);
  }
  return { url, key };
}

export async function api(path, { method = 'GET', body } = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}/api/v1${path}`, {
    method,
    headers: { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`n8n API ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function findWorkflowByName(name) {
  let cursor;
  do {
    const page = await api(`/workflows?limit=100${cursor ? `&cursor=${cursor}` : ''}`);
    const hit = page.data.find((w) => w.name === name);
    if (hit) return hit;
    cursor = page.nextCursor;
  } while (cursor);
  return null;
}

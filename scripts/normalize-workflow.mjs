// Нормализация экспорта воркфлоу n8n, чтобы diff в PR был читаемым.
// Убираем только изменчивые поля, не влияющие на поведение. Позиции узлов, id узлов и webhookId
// оставляем: без них повторный импорт ломает связи и адреса вебхуков.
// Использование: node scripts/normalize-workflow.mjs <in.json> [out.json]   (без out — перезапись in)
import { readFileSync, writeFileSync } from 'node:fs';

const VOLATILE_TOP = ['id', 'createdAt', 'updatedAt', 'versionId', 'triggerCount', 'shared', 'homeProject', 'isArchived', 'activeVersion', 'activeVersionId', 'versionCounter'];
const VOLATILE_META = ['instanceId'];

export function normalize(wf) {
  const out = {};
  for (const k of Object.keys(wf).sort()) {
    if (VOLATILE_TOP.includes(k)) continue;
    if (k === 'pinData' || k === 'staticData') continue; // тестовые данные и runtime-состояние — не источник правды
    out[k] = wf[k];
  }
  if (out.meta) {
    out.meta = Object.fromEntries(Object.entries(out.meta).filter(([k]) => !VOLATILE_META.includes(k)));
    if (Object.keys(out.meta).length === 0) delete out.meta;
  }
  if (Array.isArray(out.nodes)) {
    out.nodes = out.nodes
      .map((n) => sortKeys(n))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }
  if (out.connections) out.connections = sortKeys(out.connections, true);
  if (out.settings) out.settings = sortKeys(out.settings);
  out.active = false; // активность задаётся окружением при импорте, не репозиторием
  return out;
}

function sortKeys(obj, deep = false) {
  if (Array.isArray(obj)) return deep ? obj.map((v) => sortKeys(v, deep)) : obj;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, deep ? sortKeys(obj[k], deep) : obj[k]]));
  }
  return obj;
}

export function normalizeFile(input, output = input) {
  const wf = JSON.parse(readFileSync(input, 'utf8'));
  writeFileSync(output, JSON.stringify(normalize(wf), null, 2) + '\n');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [input, output] = process.argv.slice(2);
  if (!input) { console.error('Использование: node scripts/normalize-workflow.mjs <in.json> [out.json]'); process.exit(2); }
  normalizeFile(input, output);
  console.log(`Нормализовано: ${output ?? input}`);
}

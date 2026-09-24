// Экспорт воркфлоу из n8n по имени в workflows/<имя>.json с нормализацией.
// Использование: npm run export -- <имя-воркфлоу> [ещё имена]   |   npm run export -- --all
import { writeFileSync, mkdirSync } from 'node:fs';
import { api, findWorkflowByName } from './n8n-api.mjs';
import { normalize } from './normalize-workflow.mjs';

const args = process.argv.slice(2);
if (args.length === 0) { console.error('Использование: npm run export -- <имя-воркфлоу> | --all'); process.exit(2); }
mkdirSync('workflows', { recursive: true });

async function save(wf) {
  const full = await api(`/workflows/${wf.id}`);
  const file = `workflows/${full.name}.json`;
  writeFileSync(file, JSON.stringify(normalize(full), null, 2) + '\n');
  console.log(`→ ${file}`);
}

if (args[0] === '--all') {
  let cursor;
  do {
    const page = await api(`/workflows?limit=100${cursor ? `&cursor=${cursor}` : ''}`);
    for (const wf of page.data) await save(wf);
    cursor = page.nextCursor;
  } while (cursor);
} else {
  for (const name of args) {
    const wf = await findWorkflowByName(name);
    if (!wf) { console.error(`Воркфлоу «${name}» не найден в n8n`); process.exitCode = 1; continue; }
    await save(wf);
  }
}

// Проверка конституции проекта для workflows/<имя>.json.
// Использование: npm run check -- <имя-воркфлоу> [ещё имена]   |   npm run check -- --all
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const MAX_CODE_LINES = 50;
const SECRET_RE = /(api[_-]?key|token|password|secret|authorization)["']?\s*[:=]\s*["'][^"'{$][^"']{7,}/i;

let names = process.argv.slice(2);
if (names[0] === '--all') names = readdirSync('workflows').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
if (names.length === 0) { console.error('Использование: npm run check -- <имя-воркфлоу> | --all'); process.exit(2); }

let failed = false;
for (const name of names) {
  const file = `workflows/${name}.json`;
  const errors = [];
  if (!existsSync(file)) { console.error(`✗ ${name}: нет файла ${file}`); failed = true; continue; }
  const raw = readFileSync(file, 'utf8');
  const wf = JSON.parse(raw);

  if (wf.name !== name) errors.push(`имя воркфлоу «${wf.name}» не совпадает с именем файла «${name}» (правило 1)`);
  if (SECRET_RE.test(raw)) errors.push('похоже на секрет в JSON (правило 2)');
  const specPath = `openspec/specs/${name}/spec.md`;
  const note = (wf.nodes ?? []).find((n) => n.type === 'n8n-nodes-base.stickyNote' && String(n.parameters?.content ?? '').includes(specPath));
  if (!note) errors.push(`нет Sticky Note с текстом «${specPath}» (правило 3)`);
  if (!existsSync(specPath)) errors.push(`нет спеки ${specPath}`);
  if (!wf.settings?.errorWorkflow) errors.push('не назначен Error Workflow, settings.errorWorkflow (правило 4)');
  for (const n of wf.nodes ?? []) {
    if (n.type !== 'n8n-nodes-base.code') continue;
    const code = n.parameters?.jsCode ?? n.parameters?.pythonCode ?? '';
    const lines = code.split('\n').filter((l) => l.trim()).length;
    if (lines > MAX_CODE_LINES) errors.push(`Code-нода «${n.name}»: ${lines} строк, лимит ${MAX_CODE_LINES} (правило 5)`);
  }
  const testsDir = `tests/${name}`;
  const cases = existsSync(testsDir) ? readdirSync(testsDir).filter((f) => /^case-\d+\.input\.json$/.test(f)) : [];
  if (cases.length === 0) errors.push(`нет тест-кейсов в ${testsDir}/ (правило 6)`);
  for (const c of cases) {
    const expected = `${testsDir}/${c.replace('.input.', '.expected.')}`;
    if (!existsSync(expected)) errors.push(`для ${c} нет ${expected}`);
  }

  if (errors.length) { failed = true; console.error(`✗ ${name}\n  - ${errors.join('\n  - ')}`); }
  else console.log(`✓ ${name}`);
}
process.exit(failed ? 1 : 0);

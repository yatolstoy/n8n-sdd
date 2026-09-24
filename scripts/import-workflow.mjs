// Импорт workflows/<имя>.json в n8n: обновляет существующий воркфлоу с тем же именем или создаёт новый.
// Активацию не трогает — это делается в n8n руками или отдельной командой.
// Использование: npm run import -- <имя-воркфлоу> [ещё имена]
import { readFileSync } from 'node:fs';
import { api, findWorkflowByName } from './n8n-api.mjs';

const names = process.argv.slice(2);
if (names.length === 0) { console.error('Использование: npm run import -- <имя-воркфлоу>'); process.exit(2); }

for (const name of names) {
  const wf = JSON.parse(readFileSync(`workflows/${name}.json`, 'utf8'));
  // Публичный API принимает только эти поля при создании/обновлении.
  const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings ?? {} };
  const existing = await findWorkflowByName(name);
  const result = existing
    ? await api(`/workflows/${existing.id}`, { method: 'PUT', body })
    : await api('/workflows', { method: 'POST', body });
  console.log(`${existing ? 'Обновлён' : 'Создан'}: ${result.name} (id ${result.id})`);
}

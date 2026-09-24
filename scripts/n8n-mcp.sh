#!/usr/bin/env sh
# Запуск n8n-mcp для Claude Code. Секреты берутся из .env (в git не попадает), сам .mcp.json чистый.
# Без .env сервер стартует в режиме «только документация по нодам», без доступа к инстансу.
cd "$(dirname "$0")/.." || exit 1
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
export MCP_MODE=stdio LOG_LEVEL="${LOG_LEVEL:-error}" DISABLE_CONSOLE_OUTPUT=true
exec npx -y n8n-mcp@2.84.1

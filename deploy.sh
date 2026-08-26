#!/bin/bash
# Деплой DorogaDomoy.by
# Запуск: ./deploy.sh (из корня репозитория, с sudo для systemctl/nginx)
#
# Опционально:
#   VITE_API_URL=https://dorogadomoy.by ./deploy.sh
#   DEPLOY_WARM_CLIP=1 ./deploy.sh   — скачать CLIP-модель (fastembed) при деплое
#   SMOKE_BASE_URL=https://dorogadomoy.by ./deploy.sh

set -e

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
FRONTEND_DIR="${FRONTEND_DIR:-$REPO_DIR/frontend}"
DB_DIR="/var/lib/dorogadomoy"
SERVICE_USER="${SERVICE_USER:-dorogado}"
# Origin бэкенда без /api/v1 (клиент добавляет /api/v1 к JSON; /uploads — от корня origin)
VITE_API_URL="${VITE_API_URL:-https://dorogadomoy.by}"
SMOKE_BASE_URL="${SMOKE_BASE_URL:-$VITE_API_URL}"

PYTHON="python3"
PIP="pip3"
if [ -x "$REPO_DIR/backend/.venv/bin/python" ]; then
  PYTHON="$REPO_DIR/backend/.venv/bin/python"
  PIP="$REPO_DIR/backend/.venv/bin/pip"
fi

echo "==> Деплой DorogaDomoy.by"
echo "    REPO_DIR=$REPO_DIR"
echo "    FRONTEND_DIR=$FRONTEND_DIR"
echo "    PYTHON=$PYTHON"
echo ""

# Ветка деплоя (по умолчанию main)
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

cd "$REPO_DIR"

# 1. Синхронизация с GitHub (сервер = точная копия origin, без merge-конфликтов)
echo "==> 1. git fetch + reset (ветка: $DEPLOY_BRANCH)"
git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"

# 2. Обновить зависимости
echo "==> 2. npm install"
npm install

echo "==> 3. pip install (backend, incl. fastembed для CLIP)"
"$PIP" install -q -r backend/requirements.txt

# 3b. Миграция SQLite (pets.photo_embedding и др.)
echo "==> 4. migrate_schema.py"
if [ -f backend/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
fi
( cd backend && "$PYTHON" migrate_schema.py )

# 3c. Опционально: предзагрузка CLIP (~сотни МБ, ускоряет первый запрос похожих по фото)
if [ "${DEPLOY_WARM_CLIP:-0}" = "1" ]; then
  echo "==> 5. DEPLOY_WARM_CLIP: загрузка модели fastembed"
  ( cd backend && "$PYTHON" -c "from integrations.photo_embeddings import _get_model; m=_get_model(); print('CLIP:', 'ok' if m else 'skipped')" ) || \
    echo "    Предупреждение: CLIP не загрузился — rule-based похожие всё равно работают"
else
  echo "==> 5. CLIP warm-up пропущен (DEPLOY_WARM_CLIP=1 для предзагрузки модели)"
fi

# AI: Groq для подсказок породы/окраса в форме (опционально)
if [ -f backend/.env ] && grep -qE '^GROQ_API_KEY=.+[^[:space:]]' backend/.env; then
  echo "    GROQ_API_KEY: задан — AI-подсказки в форме включены"
else
  echo "    ПРЕДУПРЕЖДЕНИЕ: GROQ_API_KEY не задан в backend/.env"
  echo "    → Подсказки по фото отключены; похожие объявления работают без AI"
  echo "    → Ключ: https://console.groq.com/keys (см. backend/.env.example)"
fi

# 4. Права на БД и uploads (идемпотентно, не сломает уже настроенное)
echo "==> 6. Проверка прав на директорию БД и uploads"
UPLOADS_DIR="$REPO_DIR/backend/uploads"
mkdir -p "$UPLOADS_DIR"
if [ "$(id -u)" -eq 0 ]; then
  if [ -d "$DB_DIR" ]; then
    chown -R "$SERVICE_USER:$SERVICE_USER" "$DB_DIR"
    chmod 755 "$DB_DIR"
    [ -f "$DB_DIR/petfinder.db" ] && chmod 664 "$DB_DIR/petfinder.db"
    echo "    Права БД обновлены для $SERVICE_USER"
  else
    echo "    $DB_DIR не найдена — создайте и настройте вручную (см. backend/DEPLOY.md)"
  fi
  chown -R "$SERVICE_USER:$SERVICE_USER" "$UPLOADS_DIR"
  chmod 755 "$UPLOADS_DIR"
  echo "    Права uploads обновлены для $SERVICE_USER"
else
  echo "    Пропуск chown (нужен root); uploads: $UPLOADS_DIR"
fi

# 5. Сборка фронтенда
echo "==> 7. Сборка фронтенда (VITE_API_URL=$VITE_API_URL)"
VITE_API_URL="$VITE_API_URL" npm run build

# 6. Копирование билда
echo "==> 8. Копирование dist/ в frontend/"
mkdir -p "$FRONTEND_DIR"
rsync -av --delete dist/ "$FRONTEND_DIR/"

# 7. Перезапуск backend
echo "==> 9. Перезапуск dorogadomoy"
sudo systemctl restart dorogadomoy
sleep 2
if systemctl is-active --quiet dorogadomoy; then
  echo "    Backend запущен"
else
  echo "    ОШИБКА: backend не запустился. Проверьте: journalctl -u dorogadomoy -n 50"
  exit 1
fi

# 8. Перезагрузка nginx
echo "==> 10. Перезагрузка nginx"
sudo systemctl reload nginx

# 9. Smoke tests
echo "==> 11. Smoke tests ($SMOKE_BASE_URL)"
if curl -sf "$SMOKE_BASE_URL/health" | grep -q '"status"'; then
  echo "    /health: ok"
else
  echo "    /health: FAIL"
fi
if curl -sf "$SMOKE_BASE_URL/api/v1/feature-flags" >/dev/null; then
  echo "    /api/v1/feature-flags: ok"
else
  echo "    /api/v1/feature-flags: FAIL"
fi
SW_CT="$(curl -sI "$SMOKE_BASE_URL/sw.js" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2}')"
if echo "$SW_CT" | grep -qi 'javascript'; then
  echo "    /sw.js: ok ($SW_CT)"
else
  echo "    /sw.js: FAIL Content-Type=$SW_CT (должен быть JavaScript, не HTML — иначе старый SW не снимается)"
fi
SIMILAR_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$SMOKE_BASE_URL/api/v1/pets/pet-smoketest/similar")"
if [ "$SIMILAR_CODE" = "404" ]; then
  echo "    /api/v1/pets/{id}/similar: ok (маршрут есть, 404 для несуществующего id)"
else
  echo "    /api/v1/pets/{id}/similar: HTTP $SIMILAR_CODE (ожидался 404)"
fi

echo ""
echo "==> Деплой завершён."
if [ -f backend/.env ] && grep -qE '^GROQ_API_KEY=.+[^[:space:]]' backend/.env; then
  echo "    AI в форме: включён (GROQ_API_KEY задан)"
else
  echo "    AI в форме: выключен (нет GROQ_API_KEY) — сайт при этом работает"
fi
echo "    Проверка: curl -s http://127.0.0.1:8000/health"

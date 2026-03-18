#!/bin/bash
# Деплой DorogaDomoy.by
# Запуск: ./deploy.sh (из корня репозитория, с sudo для systemctl/nginx)

set -e

REPO_DIR="${REPO_DIR:-/home/dorogado/DorogaDomoy.by}"
FRONTEND_DIR="${FRONTEND_DIR:-/home/dorogado/DorogaDomoy.by/frontend}"
DB_DIR="/var/lib/dorogadomoy"
SERVICE_USER="${SERVICE_USER:-dorogado}"
VITE_API_URL="${VITE_API_URL:-https://dorogadomoy.by/api}"

echo "==> Деплой DorogaDomoy.by"
echo "    REPO_DIR=$REPO_DIR"
echo "    FRONTEND_DIR=$FRONTEND_DIR"
echo ""

cd "$REPO_DIR"

# 1. Подтянуть изменения
echo "==> 1. git pull"
git pull origin main

# 2. Обновить зависимости
echo "==> 2. npm install"
npm install

echo "==> 3. pip install (backend)"
if [ -d backend/.venv ]; then
  backend/.venv/bin/pip install -q -r backend/requirements.txt
elif command -v pip3 &>/dev/null; then
  pip3 install -q -r backend/requirements.txt
fi

# 4. Права на БД (идемпотентно, не сломает уже настроенное)
echo "==> 4. Проверка прав на директорию БД"
if [ -d "$DB_DIR" ]; then
  if [ "$(id -u)" -eq 0 ]; then
    chown -R "$SERVICE_USER:$SERVICE_USER" "$DB_DIR"
    chmod 755 "$DB_DIR"
    [ -f "$DB_DIR/petfinder.db" ] && chmod 664 "$DB_DIR/petfinder.db"
    echo "    Права обновлены для $SERVICE_USER"
  else
    echo "    Директория есть, пропуск chown (нужен root)"
  fi
else
  echo "    $DB_DIR не найдена — создайте и настройте вручную (см. backend/DEPLOY.md)"
fi

# 5. Сборка фронтенда
echo "==> 5. Сборка фронтенда (VITE_API_URL=$VITE_API_URL)"
VITE_API_URL="$VITE_API_URL" npm run build

# 6. Копирование билда
echo "==> 6. Копирование dist/ в frontend/"
mkdir -p "$FRONTEND_DIR"
rsync -av --delete dist/ "$FRONTEND_DIR/"

# 7. Перезапуск backend
echo "==> 7. Перезапуск dorogadomoy"
sudo systemctl restart dorogadomoy
sleep 2
if systemctl is-active --quiet dorogadomoy; then
  echo "    Backend запущен"
else
  echo "    ОШИБКА: backend не запустился. Проверьте: journalctl -u dorogadomoy -n 50"
  exit 1
fi

# 8. Перезагрузка nginx
echo "==> 8. Перезагрузка nginx"
sudo systemctl reload nginx

echo ""
echo "==> Деплой завершён."
echo "    Проверка: curl -s https://dorogadomoy.by/health"
echo "    API:      curl -s https://dorogadomoy.by/api/feature-flags"

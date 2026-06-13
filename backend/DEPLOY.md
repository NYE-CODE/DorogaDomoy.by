# Развёртывание backend

## Актуальная схема API

- JSON API обслуживается под префиксом `"/api/v1"` (пример: `GET /api/v1/pets`).
- Статика фото обслуживается по `"/uploads/"` на том же origin.
- `VITE_API_URL` при сборке фронта должен быть **origin без `/api/v1`**  
  (пример: `https://dorogadomoy.by`), потому что фронтенд добавляет `"/api/v1"` сам.

Пример проверки:

```bash
curl -s https://dorogadomoy.by/api/v1/feature-flags
curl -s https://dorogadomoy.by/health
```

---

## Nginx reverse proxy (рекомендуемая конфигурация)

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:8000/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:8000/uploads/;
}
```

### Статика фронтенда (SPA): без этого `/shelters`, `/my-shelters`, `/blog`, `/pet/…` дадут 404 от nginx

Каталог с билдом (`dist/` → `frontend/`) нужно отдавать с fallback на `index.html`, иначе при **прямом** заходе по URL или обновлении страницы nginx ищет файл по пути и возвращает 404, не загружая приложение.

```nginx
root /home/dorogado/DorogaDomoy.by/frontend;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}
```

Блоки `location /api/v1/` и `location /uploads/` должны быть **выше** или с более узким префиксом, чтобы не перехватывались этим `location /`.

---

## Деплой одной командой

В корне репозитория есть `deploy.sh`, который:

1. Выполняет `git pull`.
2. Обновляет зависимости `npm` и `pip`.
3. Проверяет/правит права на `/var/lib/dorogadomoy`.
4. Собирает фронтенд с `VITE_API_URL`.
5. Копирует `dist/` в директорию, которую отдаёт nginx.
6. Перезапускает backend и перезагружает nginx.

Запуск:

```bash
cd /home/dorogado/DorogaDomoy.by
chmod +x deploy.sh
./deploy.sh
```

Переменные окружения (с дефолтами в скрипте):

- `REPO_DIR` — путь к репозиторию.
- `FRONTEND_DIR` — путь назначения для фронтенд-билда.
- `SERVICE_USER` — системный пользователь backend-сервиса.
- `VITE_API_URL` — origin backend (без `/api/v1`).

Пример:

```bash
VITE_API_URL="https://staging.dorogadomoy.by" ./deploy.sh
```

---

## Ошибка `attempt to write a readonly database`

Проверьте, что `DATABASE_URL` указывает на доступную для записи директорию, например:

```bash
export DATABASE_URL="sqlite:////var/lib/dorogadomoy/petfinder.db"
```

И что права выставлены на пользователя сервиса:

```bash
sudo mkdir -p /var/lib/dorogadomoy
sudo chown dorogado:dorogado /var/lib/dorogadomoy
sudo chmod 755 /var/lib/dorogadomoy
```

Проверка состояния:

```bash
curl -s https://dorogadomoy.by/health
```

# Развёртывание backend

## Reverse proxy и API v1

Бэкенд отдаёт JSON под префиксом **`/api/v1`** (например `GET /api/v1/pets`). Статика фото — **`/uploads/`** на том же origin.

**`VITE_API_URL` при сборке фронта** — это **origin без `/api/v1`** (например `https://dorogadomoy.by` или `http://localhost:8000`): в коде к нему добавляется `/api/v1` для REST.

**nginx** должен проксировать **`/api/v1/`** на uvicorn с сохранением префикса:

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:8000/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
location /uploads/ {
    proxy_pass http://127.0.0.1:8000/uploads/;
}
```

Старый вариант `location /api/ { proxy_pass http://127.0.0.1:8000/; }` (отрезание `/api`) с новым бэкендом даст неверные пути; см. ниже исторические блоки про «404 /api/feature-flags» только как архив — актуальный путь проверки: `curl -s https://dorogadomoy.by/api/v1/feature-flags`.

---

## Деплой одной командой

В корне репозитория есть скрипт `deploy.sh`, который:

1. Выполняет `git pull`
2. Обновляет `npm` и `pip` зависимости
3. **Проверяет права на `/var/lib/dorogadomoy`** (chown dorogado) — защита от "readonly database"
4. Собирает фронтенд с `VITE_API_URL`
5. Копирует `dist/` в `frontend/`
6. Перезапускает backend и nginx

```bash
cd /home/dorogado/DorogaDomoy.by
chmod +x deploy.sh
./deploy.sh
```

Переменные (по умолчанию):

- `REPO_DIR` — путь к репозиторию
- `FRONTEND_DIR` — куда копировать билд (для nginx)
- `SERVICE_USER` — пользователь сервиса (для chown БД)
- `VITE_API_URL` — origin бэкенда для билда (**без** `/api/v1`; клиент добавляет сам)

Пример с другими значениями:

```bash
VITE_API_URL="https://staging.dorogadomoy.by" ./deploy.sh
```

---

## Ошибка «attempt to write a readonly database»

SQLite не может писать в файл БД — проверьте права доступа.

### 1. Укажите путь к БД в доступной для записи директории

```bash
# В .env или переменных окружения сервера:
export DATABASE_URL="sqlite:////var/lib/dorogadomoy/petfinder.db"
```

**Важно:** путь должен быть **абсолютным** и вести в директорию, куда процесс backend имеет право писать.

### 2. Создайте директорию и задайте права

Сначала узнайте, под каким пользователем запущен backend:
```bash
grep -E "User|WorkingDirectory" /etc/systemd/system/dorogadomoy.service
# или
ps aux | grep uvicorn
```

Затем:
```bash
sudo mkdir -p /var/lib/dorogadomoy
sudo chown ВАШ_ПОЛЬЗОВАТЕЛЬ:ВАШ_ПОЛЬЗОВАТЕЛЬ /var/lib/dorogadomoy
sudo chmod 755 /var/lib/dorogadomoy
```

### 3. Проверка

После перезапуска:
```bash
curl https://dorogadomoy.by/health
```

- Должно быть `"status": "ok"`

Если healthcheck не `ok`, проверьте, что `DATABASE_URL` подхватывается в systemd:

```bash
sudo systemctl show dorogadomoy --property=Environment
```

### 4. Диагностика на сервере

```bash
cd /home/dorogado/DorogaDomoy.by/backend

# С переменной (как у systemd)
export DATABASE_URL="sqlite:////var/lib/dorogadomoy/petfinder.db"
sudo -u www-data env DATABASE_URL="sqlite:////var/lib/dorogadomoy/petfinder.db" python3 check_permissions.py

# Миграция использует тот же DATABASE_URL, что и приложение
sudo -u www-data env DATABASE_URL="sqlite:////var/lib/dorogadomoy/petfinder.db" python3 migrate_schema.py

# Если WRITE OK — путь и права верные. Если FAILED — смотрите вывод.
```

### Ошибка 404 для `/api/feature-flags`

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`. Если приходит 404:

1. **Проверьте, что backend задеплоен с актуальным кодом** (включая роутер `feature_flags`):
   ```bash
   # Локально — должен вернуть флаги:
   curl http://localhost:8000/feature-flags
   ```
   Если локально работает, а на проде 404 — перезапустите сервис на сервере и проверьте, что используется последняя версия кода.

2. **Проверьте настройку reverse proxy (nginx/Caddy)**. Фронтенд шлёт запросы на `/api/*`. Бэкенд ожидает маршруты **без** префикса `/api` (например, `/feature-flags`, `/pets`). Прокси должен **отрезать** `/api` при проксировании:
   - **nginx:** `location /api/ { proxy_pass http://127.0.0.1:8000/; }` (trailing slash у `8000/` убирает `/api`)
   - **Caddy:** `reverse_proxy /api/* 127.0.0.1:8000` с `rewrite` или `handle_path` в зависимости от версии.

3. **Диагностика на проде:**
   ```bash
   curl -s https://dorogadomoy.by/api/feature-flags   # должно вернуть JSON с ff_landing_show_stats и т.д.
   curl -s https://dorogadomoy.by/api/pets           # если pets работает, а feature-flags — 404, обновите backend
   ```

4. **Fallback:** при недоступности API фича-флагов фронтенд использует значения по умолчанию (статистика и блок помощи включены). Ошибка в консоли браузера не ломает работу сайта.

### Ошибка 404 на `/api/feature-flags`

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`. Если получаете 404, возможны две причины:

**1. Backend не обновлён** — роутер `feature_flags` добавлен позже остальных. Нужно переразвернуть backend:

```bash
cd /path/to/DorogaDomoy.by/backend
git pull  # или скопируйте актуальный код
sudo systemctl restart dorogadomoy  # или как у вас называется сервис
```

**2. Прокси передаёт путь с `/api`** — FastAPI ждёт `/feature-flags`, а получает `/api/feature-flags`. Настройте nginx/Caddy так, чтобы при проксировании на backend **убирался** префикс `/api`:

```nginx
# nginx: /api/xxx -> backend получает /xxx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Проверка:

```bash
# Должно вернуть JSON с ff_landing_show_stats, ff_landing_show_help
curl https://dorogadomoy.by/api/feature-flags

# Сравните: работает ли /api/pets
curl https://dorogadomoy.by/api/pets
```

Если `/api/pets` работает, а `/api/feature-flags` — нет, значит на сервере старая версия backend без роутера `feature_flags`. Обновите и перезапустите backend.

---

### API 404: `/api/feature-flags` (или другие маршруты)

Фронтенд ходит на `https://dorogadomoy.by/api/...` (VITE_API_URL). Прокси должен проксировать эти запросы в backend.

**1. Проверка на сервере:**
```bash
# Должен вернуть JSON или 404
curl -s -o /dev/null -w "%{http_code}" https://dorogadomoy.by/api/feature-flags
curl -s -o /dev/null -w "%{http_code}" https://dorogadomoy.by/api/pets
```

**2. Возможные причины 404 для `/api/feature-flags`:**
- **Backend не обновлён** — роутер `feature_flags` добавлен позже. Переразверните backend (git pull, перезапуск uvicorn).
- **Прокси отбрасывает `/api`** — backend ожидает пути без префикса (`/feature-flags`). Убедитесь, что прокси пересылает `/api/*` в backend так, чтобы backend получал `/feature-flags`, а не `/api/feature-flags` (иначе 404).

**3. Пример nginx:**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;   # слэш убирает /api из пути
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**4. После переразвёртывания backend:**
```bash
curl https://dorogadomoy.by/api/feature-flags
# Ожидается: {"ff_landing_show_stats":"true","ff_landing_show_help":"true"}
```

---

### Альтернативные пути (под конкретное окружение)

- **systemd**: `/home/dorogadomoy/data/petfinder.db`
- **Docker**: примонтировать volume, например `-v /host/data:/app/data` и `DATABASE_URL=sqlite:////app/data/petfinder.db`
- **Панели хостинга**: домашняя папка пользователя, например `/home/username/dorogadomoy/data/petfinder.db`

---

## Ошибка 404 на /api/feature-flags

Фронтенд запрашивает `GET https://dorogadomoy.by/api/feature-flags`. Если возвращается 404:

### 1. Проверьте, что backend развёрнут с роутером feature_flags

```bash
# Должно вернуть JSON с флагами (не 404):
curl https://dorogadomoy.by/api/feature-flags

# Для сравнения — должен работать, если API в целом отвечает:
curl https://dorogadomoy.by/api/pets
```

Если `/api/pets` работает, а `/api/feature-flags` — 404, значит на сервере запущена **старая версия** backend без роутера `feature_flags`. Обновите код и перезапустите backend:

```bash
cd /путь/к/DorogaDomoy.by
git pull
# перезапуск systemd/docker
sudo systemctl restart dorogadomoy
```

### 2. Конфигурация reverse proxy (nginx / Caddy)

Фронтенд шлёт запросы на `https://dorogadomoy.by/api/*`. Прокси должен передавать их в backend.

**Если прокси убирает префикс `/api`** (рекомендуемый вариант):
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;   # слеш в конце — /api убирается
}
```
Backend ожидает маршруты без `/api` (например `/feature-flags`).

**Если прокси оставляет полный путь**:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
}
```
Тогда backend должен обслуживать `/api/*`. Сейчас в FastAPI маршруты без префикса `/api`, поэтому при такой конфигурации все `/api/*` будут отдавать 404. Либо измените конфиг прокси, либо добавьте prefix `/api` в FastAPI (`main.py`).

---

## GET /api/feature-flags 404 (Not Found)

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`; если возвращается 404, возможны две причины.

### 1. Backend на продакшене не обновлён

Роутер `feature_flags` мог быть добавлен позже. Если на сервере старая версия кода без `backend/routers/feature_flags.py`, маршрута `/feature-flags` не будет.

**Решение:** обновите и перезапустите backend на сервере:

```bash
cd /путь/к/DorogaDomoy.by
git pull
# перезапуск systemd / uvicorn
sudo systemctl restart dorogadomoy
```

### 2. Прокси передаёт путь без отсечения `/api`

Фронтенд шлёт запросы на `https://dorogadomoy.by/api/feature-flags`, а backend ожидает путь `/feature-flags` (без `/api`). Прокси должен либо:

- **Вариант A:** убирать `/api` при проксировании (`/api/feature-flags` → `/feature-flags`):

```nginx
# nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;  # слэш в конце — /api отсекается
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

- **Вариант B:** передавать полный путь и добавить в backend префикс `/api` для всех роутеров (через `main.py`).

### Проверка

```bash
# Должен вернуть JSON с ff_landing_show_stats, ff_landing_show_help
curl https://dorogadomoy.by/api/feature-flags

# Если 404 — проверьте:
curl https://dorogadomoy.by/api/pets
# Если pets работает, а feature-flags нет — почти всегда нужен redeploy backend.
```

При падении запроса feature-flags фронтенд использует значения по умолчанию; ошибка 404 в консоли не должна блокировать работу сайта.

---

## 404 на `/api/feature-flags`

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`. Ошибка 404 означает, что бэкенд не отвечает по этому пути.

### Диагностика

```bash
# Должен вернуть JSON с ff_landing_show_stats и ff_landing_show_help
curl -s https://dorogadomoy.by/api/feature-flags

# Для сравнения — работает ли другой endpoint
curl -s "https://dorogadomoy.by/api/pets?limit=1"
```

### Возможные причины

1. **Бэкенд не обновлён** — на production ещё старая версия без роутера `feature_flags`. Решение: задеплоить последний код и перезапустить backend (`git pull`, перезапуск systemd/Docker).

2. **Прокси передаёт путь с `/api`** — если nginx/Caddy пробрасывает `proxy_pass http://127.0.0.1:8000/api/;`, бэкенд получает `/api/feature-flags`, а в FastAPI маршрут объявлен как `/feature-flags`. Решение: либо прокси без `/api` (`proxy_pass http://127.0.0.1:8000/;`), либо добавить префикс `/api` ко всем API-роутерам в `main.py`.

---

## Ошибка `GET /api/feature-flags 404 (Not Found)`

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`. Backend обрабатывает маршрут `/feature-flags` (без префикса `/api`).

### 1. Проверьте, что backend развёрнут с роутером feature_flags

На сервере убедитесь, что используется актуальная версия кода:

```bash
cd /путь/к/DorogaDomoy.by/backend
git pull   # или ваша процедура деплоя
# Перезапуск сервиса
sudo systemctl restart dorogadomoy  # или как у вас
```

Роутер `feature_flags` подключается в `main.py`:

```python
from routers import feature_flags
app.include_router(feature_flags.router)
```

### 2. Диагностика маршрутизации

Проверьте, как прокси передаёт запросы в backend:

```bash
# Должен вернуть JSON с ff_landing_show_stats, ff_landing_show_help
curl -s https://dorogadomoy.by/api/feature-flags

# Если 404 — сравните с другими эндпоинтами
curl -s -o /dev/null -w "%{http_code}" https://dorogadomoy.by/api/pets
```

- Если `/api/pets` возвращает 200, а `/api/feature-flags` — 404: на production, скорее всего, backend без роутера `feature_flags`. Нужен редеплой.
- Если оба возвращают 404: проверьте конфиг nginx/Caddy — прокси должен передавать запросы на backend. Пример для nginx (с отсечением `/api`):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/;   # без /api у backend
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. Приложение при 404

При ошибке загрузки фича-флагов фронтенд использует значения по умолчанию (статистика и блок «Помощь» показываются). Сообщение 404 в консоли браузера не блокирует работу сайта.

---

## Ошибка 404 на `/api/feature-flags`

Фронтенд запрашивает `https://dorogadomoy.by/api/feature-flags`. Возможные причины 404:

### 1. На production развёртана старая версия backend

Роутер `feature_flags` добавлен недавно. Если backend не перезапускался после обновления кода — маршрут отсутствует.

**Решение:** перезапустить backend (после `git pull` / деплоя):

```bash
sudo systemctl restart dorogadomoy
# или
sudo systemctl restart uvicorn
```

Проверка:

```bash
curl https://dorogadomoy.by/api/feature-flags
# Ожидается JSON: {"ff_landing_show_stats":"true","ff_landing_show_help":"true"}
```

### 2. Прокси передаёт полный путь `/api/...` в backend

Backend ожидает путь `/feature-flags`, а получает `/api/feature-flags`. Тогда и другие эндпоинты (`/api/pets`, `/api/auth/...`) тоже должны возвращать 404.

**Если только `feature-flags` даёт 404** — скорее всего причина №1 (старый backend).

**Если все API 404** — проверьте конфиг nginx/Caddy. Должно быть *удаление* префикса `/api` при проксировании:

```nginx
# nginx — правильно (убираем /api)
location /api/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

```caddy
# Caddy — аналог
/api/* {
    reverse_proxy 127.0.0.1:8000 {
        uri strip_prefix /api
    }
}
```

### Поведение при 404

Лендинг при 404 на feature-flags использует дефолтные флаги (статистика и «Помощь» включены), приложение не падает. Ошибка видна только в консоли браузера.

---

## Ошибка 404 на `/api/feature-flags`

Фронтенд ожидает `GET https://dorogadomoy.by/api/feature-flags`. Если приходит 404, проверьте:

### 1. Backend развёрнут с последней версией

Роутер `feature_flags` добавлен в `backend/routers/feature_flags.py` и подключён в `main.py`. После изменения нужно перезапустить backend:

```bash
# Пример для systemd
sudo systemctl restart dorogadomoy
```

### 2. Диагностика

```bash
# Должен вернуть JSON с ff_landing_show_stats, ff_landing_show_help
curl https://dorogadomoy.by/api/feature-flags

# Сравните: если /api/pets работает, а /api/feature-flags — нет,
# значит backend на сервере старый (без feature_flags).
curl -s -o /dev/null -w "%{http_code}" https://dorogadomoy.by/api/pets
curl -s -o /dev/null -w "%{http_code}" https://dorogadomoy.by/api/feature-flags
```

### 3. Настройка reverse proxy (nginx)

Бэкенд слушает маршруты **без** префикса `/api` (например, `/feature-flags`, `/pets`). Прокси должен **убирать** `/api` при проксировании:

```nginx
# Правильно: /api/feature-flags → backend получает /feature-flags
location /api/ {
    proxy_pass http://127.0.0.1:8000/;   # слеш в конце — убирает /api
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Если в `proxy_pass` указать `http://127.0.0.1:8000/api/` (с `/api/`), backend получит путь `/api/feature-flags` и вернёт 404.

### 4. Примечание

При 404 на feature-flags лендинг продолжит работать: используются значения по умолчанию (статистика и блок помощи показываются). В консоли останется предупреждение 404.

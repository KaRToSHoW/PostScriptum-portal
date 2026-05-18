# Развёртывание P.S. Portal на VPS (Docker)

Ubuntu 22.04 + Docker + Nginx (внутри контейнера фронтенда).

---

## Архитектура

```
Интернет :443
     │
  Certbot/Nginx (хостовый, только для TLS)
     │
  frontend-контейнер :80  (Nginx внутри)
     ├── /          → React SPA (статика)
     └── /api/*     → backend-контейнер :8080
                            │
                       db-контейнер :5432
                       (PostgreSQL 16)
```

---

## 1. Установка Docker

```bash
apt update && apt upgrade -y

curl -fsSL https://get.docker.com | sh

# Добавить пользователя в группу docker (без sudo)
usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

---

## 2. Клонирование репозиториев

```bash
mkdir -p /opt/ps-portal && cd /opt/ps-portal

git clone https://github.com/KaRToSHoW/PostScriptum-portal.git frontend
git clone https://github.com/KaRToSHoW/PostScriptum-backend.git backend
```

> `docker-compose.yml` лежит в `frontend/`, он ссылается на `../backend/` при сборке.

---

## 3. Переменные окружения

```bash
cd /opt/ps-portal/frontend

cp .env.example .env
nano .env
```

Заполнить:

```env
POSTGRES_DB=psportal
POSTGRES_USER=psportal
POSTGRES_PASSWORD=сгенерируй_пароль

JWT_SECRET=сгенерируй_строку_мин_32_символа

FRONTEND_URL=https://твой-домен.ru
```

Сгенерировать секреты можно так:
```bash
openssl rand -base64 32
```

---

## 4. Запуск

```bash
cd /opt/ps-portal/frontend

docker compose up -d --build
```

Что произойдёт:
1. Соберётся jar бэкенда (Maven внутри Docker)
2. Соберётся статика фронтенда (Node внутри Docker)
3. Поднимутся 3 контейнера: `db`, `backend`, `frontend`
4. Сайт будет доступен на `http://IP_СЕРВЕРА`

Проверить статус:
```bash
docker compose ps
docker compose logs -f backend
```

---

## 5. HTTPS через Let's Encrypt

Установить Nginx и Certbot на хост (только для TLS-терминации):

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Создать конфиг:

```bash
nano /etc/nginx/sites-available/psportal
```

```nginx
server {
    listen 80;
    server_name твой-домен.ru www.твой-домен.ru;

    location / {
        proxy_pass         http://127.0.0.1:80;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/psportal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Получить сертификат
certbot --nginx -d твой-домен.ru -d www.твой-домен.ru
```

После этого Certbot сам добавит HTTPS-блок в конфиг.

---

## 6. Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 7. Деплой новой версии

```bash
cd /opt/ps-portal/frontend && git pull
cd /opt/ps-portal/backend  && git pull

cd /opt/ps-portal/frontend
docker compose up -d --build
```

Docker пересоберёт только изменившиеся образы, БД не тронет.

---

## 8. Полезные команды

```bash
# Логи всех контейнеров
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend

# Перезапустить один сервис без пересборки
docker compose restart backend

# Остановить всё
docker compose down

# Остановить и удалить данные БД (осторожно!)
docker compose down -v

# Подключиться к PostgreSQL внутри контейнера
docker compose exec db psql -U psportal psportal

# Войти в контейнер бэкенда
docker compose exec backend sh
```

---

## Файлы в репозитории

| Файл | Назначение |
|---|---|
| `Dockerfile` | Сборка фронтенда (Node → Nginx) |
| `nginx.conf` | Конфиг Nginx внутри контейнера |
| `docker-compose.yml` | Оркестрация всех сервисов |
| `.env.example` | Шаблон переменных окружения |
| `../backend/Dockerfile` | Сборка бэкенда (Maven → JRE) |

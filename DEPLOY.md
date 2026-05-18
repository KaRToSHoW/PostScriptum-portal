# Развёртывание P.S. Portal на VPS

Инструкция для Ubuntu 22.04. Предполагается чистый сервер с доменом.

---

## 1. Первичная настройка сервера

```bash
# Обновить пакеты
apt update && apt upgrade -y

# Создать пользователя (не работать под root)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## 2. Установка зависимостей

### Java 21
```bash
sudo apt install -y openjdk-21-jdk
java -version
```

### Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

### PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 3. База данных PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE USER psportal WITH PASSWORD 'ВАШ_ПАРОЛЬ_БД';
CREATE DATABASE psportal OWNER psportal;
GRANT ALL PRIVILEGES ON DATABASE psportal TO psportal;
\q
```

---

## 4. Клонирование репозиториев

```bash
cd /opt
sudo mkdir ps-portal && sudo chown deploy:deploy ps-portal
cd ps-portal

git clone https://github.com/KaRToSHoW/PostScriptum-backend.git backend
git clone https://github.com/KaRToSHoW/PostScriptum-portal.git frontend
```

---

## 5. Настройка бэкенда

```bash
cd /opt/ps-portal/backend

# Создать конфиг из шаблона
cp src/main/resources/application-example.yml src/main/resources/application.yml
nano src/main/resources/application.yml
```

Заменить содержимое на продакшн-конфиг:

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/psportal
    username: psportal
    password: ВАШ_ПАРОЛЬ_БД
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
    show-sql: false
  h2:
    console:
      enabled: false

app:
  jwt:
    secret: ВАШ_СЕКРЕТ_МИН_32_СИМВОЛА_СЛУЧАЙНЫЙ
    expiration-ms: 86400000

cors:
  allowed-origins: https://ВАШ_ДОМЕН
```

```bash
# Собрать jar
./mvnw clean package -DskipTests

# Проверить что собралось
ls target/*.jar
```

### Systemd-сервис для бэкенда

```bash
sudo nano /etc/systemd/system/psportal-backend.service
```

```ini
[Unit]
Description=P.S. Portal Backend
After=network.target postgresql.service

[Service]
User=deploy
WorkingDirectory=/opt/ps-portal/backend
ExecStart=/usr/bin/java -jar /opt/ps-portal/backend/target/portal-0.0.1-SNAPSHOT.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable psportal-backend
sudo systemctl start psportal-backend

# Проверить статус
sudo systemctl status psportal-backend
sudo journalctl -u psportal-backend -f
```

---

## 6. Сборка фронтенда

```bash
cd /opt/ps-portal/frontend

# Создать .env с адресом API
echo "VITE_API_URL=https://ВАШ_ДОМЕН" > .env

npm install
npm run build

# Статика собрана в dist/
ls dist/
```

---

## 7. Nginx

```bash
sudo nano /etc/nginx/sites-available/psportal
```

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН www.ВАШ_ДОМЕН;

    # Фронтенд (статика)
    root /opt/ps-portal/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → бэкенд
    location /api/ {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/psportal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ_ДОМЕН -d www.ВАШ_ДОМЕН

# Автообновление уже настроено certbot-ом, проверить:
sudo systemctl status certbot.timer
```

---

## 9. Деплой новой версии

### Бэкенд
```bash
cd /opt/ps-portal/backend
git pull
./mvnw clean package -DskipTests
sudo systemctl restart psportal-backend
```

### Фронтенд
```bash
cd /opt/ps-portal/frontend
git pull
npm install
npm run build
# nginx отдаёт файлы напрямую из dist/ — перезапуск не нужен
```

---

## 10. Полезные команды

```bash
# Логи бэкенда live
sudo journalctl -u psportal-backend -f

# Статус всех сервисов
sudo systemctl status psportal-backend nginx postgresql

# Перезапустить всё
sudo systemctl restart psportal-backend nginx

# Открыть порты в firewall (если ufw включён)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Итоговая архитектура

```
Интернет
   │  443 (HTTPS)
   ▼
 Nginx
   ├── /        → dist/ (статика React)
   └── /api/*   → localhost:8080 (Spring Boot)
                       │
                  PostgreSQL :5432
```

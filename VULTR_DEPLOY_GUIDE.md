# VEM — Vultr Serverga Ko'chirish Qo'llanmasi

## 1-Qadam: Vultr Server Yaratish

1. [vultr.com](https://vultr.com) ga kiring
2. **Deploy New Instance** bosing
3. Tanlang:
   - **Type**: Cloud Compute (Shared CPU)
   - **Location**: Sizga yaqin joy (masalan Frankfurt yoki Istanbul)
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Minimal $6/oy (1 CPU, 1GB RAM, 25GB SSD) — boshlash uchun yetarli
4. **SSH Key** qo'shing (tavsiya etiladi) yoki parol bilan kiring
5. **Deploy Now** bosing

---

## 2-Qadam: Serverga Ulanish

```bash
ssh root@SIZNING_SERVER_IP
```

---

## 3-Qadam: Kerakli Dasturlarni O'rnatish

```bash
# Tizimni yangilash
apt update && apt upgrade -y

# Node.js 20 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# npm yangilash
npm install -g npm@latest

# PostgreSQL o'rnatish
apt install -y postgresql postgresql-contrib

# Nginx o'rnatish (reverse proxy uchun)
apt install -g nginx

# Git o'rnatish
apt install -y git

# PM2 o'rnatish (Node.js process manager)
npm install -g pm2
```

---

## 4-Qadam: PostgreSQL Bazasini Sozlash

```bash
# PostgreSQL ga kirish
sudo -u postgres psql

# Baza va foydalanuvchi yaratish
CREATE DATABASE vem_db;
CREATE USER vem_user WITH ENCRYPTED PASSWORD 'KUCHLI_PAROL_YOZING';
GRANT ALL PRIVILEGES ON DATABASE vem_db TO vem_user;

# Yangi bazaga ulanish va huquqlar berish
\c vem_db
GRANT ALL ON SCHEMA public TO vem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vem_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vem_user;

\q
```

**DATABASE_URL** ni yozib qo'ying:
```
postgresql://vem_user:KUCHLI_PAROL_YOZING@localhost:5432/vem_db
```

---

## 5-Qadam: Loyihani Serverga Ko'chirish

### Variant A: Git orqali (tavsiya etiladi)

Kodni GitHub/GitLab ga yuklang, keyin serverda:

```bash
cd /var/www
git clone https://github.com/SIZNING_REPO/vem.git
cd vem
```

### Variant B: To'g'ridan-to'g'ri ko'chirish

Kompyuteringizdan:
```bash
# Replit dan kodni yuklab oling (Download as ZIP)
# Keyin serverga ko'chiring:
scp -r ./vem root@SIZNING_SERVER_IP:/var/www/vem
```

---

## 6-Qadam: Loyihani Sozlash

```bash
cd /var/www/vem

# Paketlarni o'rnatish
npm install

# .env faylini yaratish
nano .env
```

`.env` fayliga yozing:
```env
DATABASE_URL=postgresql://vem_user:KUCHLI_PAROL_YOZING@localhost:5432/vem_db
NODE_ENV=production
PORT=5000
SESSION_SECRET=BU_YERGA_UZUN_TASODIFIY_MATN_YOZING
```

> `SESSION_SECRET` uchun tasodifiy matn yaratish:
> ```bash
> openssl rand -hex 32
> ```

---

## 7-Qadam: Bazani Tayyorlash va Loyihani Build Qilish

```bash
cd /var/www/vem

# Drizzle migratsiyalarini yaratish va qo'llash
npx drizzle-kit push

# Loyihani build qilish
npm run build
```

---

## 8-Qadam: PM2 Bilan Ishga Tushirish

```bash
cd /var/www/vem

# Ishga tushirish
pm2 start dist/index.cjs --name "vem" --env production

# Server qayta yonganda avtomatik ishga tushishi uchun
pm2 startup
pm2 save

# Loglarni ko'rish
pm2 logs vem
```

**PM2 buyruqlari:**
```bash
pm2 status          # Holat
pm2 restart vem     # Qayta ishga tushirish
pm2 stop vem        # To'xtatish
pm2 logs vem        # Loglar
```

---

## 9-Qadam: Nginx Sozlash (Reverse Proxy)

```bash
nano /etc/nginx/sites-available/vem
```

Quyidagini yozing:
```nginx
server {
    listen 80;
    server_name sizning-domain.com www.sizning-domain.com;
    # Agar domain yo'q bo'lsa, IP bilan:
    # server_name SIZNING_SERVER_IP;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Saytni yoqish
ln -s /etc/nginx/sites-available/vem /etc/nginx/sites-enabled/

# Default saytni o'chirish
rm /etc/nginx/sites-enabled/default

# Nginx ni tekshirish va qayta ishga tushirish
nginx -t
systemctl restart nginx
```

---

## 10-Qadam: SSL Sertifikat (HTTPS) — Domain bo'lsa

```bash
# Certbot o'rnatish
apt install -y certbot python3-certbot-nginx

# SSL olish (domain kerak)
certbot --nginx -d sizning-domain.com -d www.sizning-domain.com

# Avtomatik yangilanish
certbot renew --dry-run
```

---

## 11-Qadam: Firewall Sozlash

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## 12-Qadam: Tekshirish

Brauzerda oching:
- Domain bilan: `https://sizning-domain.com`
- IP bilan: `http://SIZNING_SERVER_IP`

---

## Yangilash (Kodni yangilash kerak bo'lganda)

```bash
cd /var/www/vem

# Yangi kodni olish (Git bilan)
git pull origin main

# Paketlarni yangilash
npm install

# Bazani yangilash
npx drizzle-kit push

# Qayta build qilish
npm run build

# Qayta ishga tushirish
pm2 restart vem
```

---

## Muammolarni Bartaraf Qilish

| Muammo | Yechim |
|---|---|
| Sayt ochilmaydi | `pm2 status` — "online" ekanini tekshiring |
| Baza ulanmaydi | `sudo systemctl status postgresql` — ishlayotganini tekshiring |
| 502 Bad Gateway | `pm2 logs vem` — xatolarni ko'ring |
| Port band | `lsof -i :5000` — portni kim ishlatayotganini ko'ring |
| SSL muammo | `certbot renew` — sertifikatni yangilang |

---

## Tavsiya Etiladigan Vultr Reja

| Foydalanuvchilar soni | Reja | Narx |
|---|---|---|
| 0-500 | 1 CPU, 1GB RAM | $6/oy |
| 500-2000 | 1 CPU, 2GB RAM | $12/oy |
| 2000-10000 | 2 CPU, 4GB RAM | $24/oy |
| 10000+ | 4 CPU, 8GB RAM | $48/oy |

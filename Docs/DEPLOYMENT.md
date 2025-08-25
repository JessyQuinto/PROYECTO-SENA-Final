# Guía de Despliegue - Tesoros Chocó

## 🚀 Visión General del Despliegue

**Tesoros Chocó** está diseñado para ser desplegado tanto en entornos de desarrollo local como en servidores de producción. El proyecto utiliza tecnologías modernas que facilitan el despliegue y la escalabilidad.

## 📋 Prerrequisitos del Sistema

### Requisitos Mínimos
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0 o **Bun**: >= 1.0.0 (recomendado)
- **Git**: >= 2.30.0
- **Memoria RAM**: 4GB mínimo, 8GB recomendado
- **Espacio en disco**: 2GB mínimo

### Requisitos Recomendados
- **Node.js**: >= 20.0.0 LTS
- **Bun**: >= 1.0.0 (para mejor performance)
- **Memoria RAM**: 8GB o más
- **Espacio en disco**: 5GB o más
- **CPU**: 4 cores o más

### Verificación de Prerrequisitos
```bash
# Verificar Node.js
node --version
# Debe mostrar v20.x.x o superior

# Verificar npm
npm --version
# Debe mostrar 10.x.x o superior

# Verificar Bun (opcional pero recomendado)
bun --version
# Debe mostrar 1.x.x o superior

# Verificar Git
git --version
# Debe mostrar 2.30.x o superior
```

## 🏠 Despliegue Local (Desarrollo)

### 1. Clonar el Repositorio

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd PROYECTO-SENA-main-main

# Verificar la estructura del proyecto
ls -la
# Debe mostrar: Backend/, Frontend/, Docs/, package.json, etc.
```

### 2. Configurar Variables de Entorno

#### Frontend (.env.local)
```bash
cd Frontend
cp env.example .env.local
```

Editar `.env.local`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Backend API
VITE_BACKEND_URL=http://localhost:3001

# Environment
VITE_NODE_ENV=development
VITE_APP_NAME=Tesoros Chocó
VITE_APP_VERSION=1.0.0
```

#### Backend (.env)
```bash
cd Backend
cp .env.example .env
```

Editar `.env`:
```env
# Environment
NODE_ENV=development
PORT=3001

# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Frontend Origins (CORS)
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=debug
```

### 3. Instalar Dependencias

#### Opción 1: Con Bun (Recomendado)
```bash
# Instalar dependencias del workspace
bun install

# O instalar por separado
cd Frontend && bun install
cd ../Backend && bun install
```

#### Opción 2: Con npm
```bash
# Instalar dependencias del workspace
npm install

# O instalar por separado
cd Frontend && npm install
cd ../Backend && npm install
```

### 4. Configurar Supabase

#### Crear Proyecto en Supabase
1. Ir a [https://supabase.com](https://supabase.com)
2. Crear nueva cuenta o iniciar sesión
3. Crear nuevo proyecto
4. Anotar `Project URL` y `anon public` key

#### Configurar Base de Datos
```sql
-- Ejecutar en SQL Editor de Supabase
-- Crear tablas principales (ejemplo básico)

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'comprador',
  nombre_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES users(id),
  categoria_id UUID REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
```

### 5. Ejecutar en Desarrollo

#### Terminal 1 - Backend
```bash
cd Backend
bun run dev
# El backend estará en http://localhost:3001
```

#### Terminal 2 - Frontend
```bash
cd Frontend
bun run dev
# El frontend estará en http://localhost:3000
```

### 6. Verificar el Despliegue

#### Backend
```bash
# Verificar health check
curl http://localhost:3001/health
# Debe retornar: {"ok":true,"service":"backend-demo",...}

# Verificar CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3001/auth/post-signup
```

#### Frontend
- Abrir [http://localhost:3000](http://localhost:3000)
- Verificar que la aplicación carga correctamente
- Verificar que no hay errores en la consola del navegador
- Verificar que la conexión con Supabase funciona

## 🌐 Despliegue en Producción

### 1. Preparación del Servidor

#### Requisitos del Servidor
- **Sistema Operativo**: Ubuntu 22.04 LTS o superior
- **Memoria RAM**: 8GB mínimo, 16GB recomendado
- **Espacio en disco**: 20GB mínimo
- **CPU**: 4 cores mínimo
- **Red**: Conexión estable a internet

#### Configuración del Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Configuración de Dominio y SSL

#### Configurar DNS
```bash
# Agregar registros A en tu proveedor de DNS
# Ejemplo para Cloudflare:
# A     api.tesoroschoco.com     <IP-DEL-SERVIDOR>
# A     tesoroschoco.com         <IP-DEL-SERVIDOR>
# CNAME  www.tesoroschoco.com    tesoroschoco.com
```

#### Configurar SSL con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tesoroschoco.com -d www.tesoroschoco.com
sudo certbot --nginx -d api.tesoroschoco.com

# Configurar renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Despliegue del Backend

#### Preparar el Código
```bash
# En tu máquina local
cd Backend
bun run build
# Esto creará la carpeta dist/ con el código compilado

# Crear archivo de producción
cp .env .env.production
# Editar .env.production con valores de producción
```

#### Subir al Servidor
```bash
# En el servidor
cd /var/www
sudo mkdir tesoros-choco
sudo chown $USER:$USER tesoros-choco
cd tesoros-choco

# Clonar o subir código
git clone <url-del-repositorio> .
# O usar scp/rsync para subir archivos

# Instalar dependencias de producción
cd Backend
npm ci --only=production
```

#### Configurar PM2
```bash
# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tesoros-choco-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Iniciar aplicación
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Configurar Nginx
```bash
# Crear configuración para el backend
sudo nano /etc/nginx/sites-available/api.tesoroschoco.com

# Contenido:
server {
    listen 80;
    server_name api.tesoroschoco.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tesoroschoco.com;

    ssl_certificate /etc/letsencrypt/live/api.tesoroschoco.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tesoroschoco.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
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

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/api.tesoroschoco.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Despliegue del Frontend

#### Preparar el Build
```bash
# En tu máquina local
cd Frontend
bun run build
# Esto creará la carpeta dist/ con archivos estáticos
```

#### Subir al Servidor
```bash
# En el servidor
cd /var/www/tesoros-choco/Frontend
# Subir contenido de la carpeta dist/ a /var/www/tesoros-choco/frontend
```

#### Configurar Nginx para Frontend
```bash
# Crear configuración para el frontend
sudo nano /etc/nginx/sites-available/tesoroschoco.com

# Contenido:
server {
    listen 80;
    server_name tesoroschoco.com www.tesoroschoco.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tesoroschoco.com www.tesoroschoco.com;

    ssl_certificate /etc/letsencrypt/live/tesoroschoco.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tesoroschoco.com/privkey.pem;

    root /var/www/tesoros-choco/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/tesoroschoco.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configuración de Base de Datos en Producción

#### Configurar Supabase
1. Crear proyecto en Supabase
2. Configurar variables de entorno con URLs de producción
3. Configurar RLS policies para producción
4. Configurar backups automáticos

#### Variables de Entorno de Producción
```env
# Backend (.env.production)
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://tu-proyecto-prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-prod
FRONTEND_ORIGINS=https://tesoroschoco.com,https://www.tesoroschoco.com

# Frontend (build-time)
VITE_SUPABASE_URL=https://tu-proyecto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-prod
VITE_BACKEND_URL=https://api.tesoroschoco.com
VITE_NODE_ENV=production
```

## 🧪 Testing del Despliegue

### 1. Verificación del Backend
```bash
# Health check
curl https://api.tesoroschoco.com/health

# Verificar CORS
curl -H "Origin: https://tesoroschoco.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.tesoroschoco.com/auth/post-signup
```

### 2. Verificación del Frontend
- Abrir [https://tesoroschoco.com](https://tesoroschoco.com)
- Verificar que carga correctamente
- Verificar conexión con Supabase
- Verificar que no hay errores en consola
- Verificar funcionalidades principales

### 3. Verificación de SSL
```bash
# Verificar certificado SSL
openssl s_client -connect tesoroschoco.com:443 -servername tesoroschoco.com
openssl s_client -connect api.tesoroschoco.com:443 -servername api.tesoroschoco.com
```

## 📊 Monitoreo y Mantenimiento

### 1. Monitoreo con PM2
```bash
# Ver estado de aplicaciones
pm2 status
pm2 monit

# Ver logs
pm2 logs tesoros-choco-backend

# Reiniciar aplicación
pm2 restart tesoros-choco-backend

# Ver métricas
pm2 show tesoros-choco-backend
```

### 2. Monitoreo de Nginx
```bash
# Ver estado
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Verificar configuración
sudo nginx -t
```

### 3. Monitoreo del Sistema
```bash
# Ver uso de recursos
htop
df -h
free -h

# Ver logs del sistema
sudo journalctl -f
```

## 🔄 Actualizaciones y Rollbacks

### 1. Proceso de Actualización
```bash
# 1. Crear backup
pm2 save
cp -r /var/www/tesoros-choco /var/www/tesoros-choco.backup.$(date +%Y%m%d)

# 2. Actualizar código
cd /var/www/tesoros-choco
git pull origin main

# 3. Instalar dependencias
cd Backend && npm ci --only=production
cd ../Frontend && npm ci --only=production

# 4. Build del frontend
cd Frontend && npm run build

# 5. Reiniciar backend
pm2 restart tesoros-choco-backend

# 6. Verificar funcionamiento
curl https://api.tesoroschoco.com/health
```

### 2. Rollback en Caso de Problemas
```bash
# 1. Detener aplicación
pm2 stop tesoros-choco-backend

# 2. Restaurar backup
rm -rf /var/www/tesoros-choco
cp -r /var/www/tesoros-choco.backup.$(date +%Y%m%d) /var/www/tesoros-choco

# 3. Reiniciar aplicación
pm2 start tesoros-choco-backend

# 4. Verificar funcionamiento
curl https://api.tesoroschoco.com/health
```

## 🚨 Troubleshooting Común

### 1. Problemas de CORS
```bash
# Verificar configuración CORS en backend
# Verificar que FRONTEND_ORIGINS incluya el dominio correcto
# Verificar que Nginx esté configurado correctamente
```

### 2. Problemas de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar configuración de Nginx
sudo nginx -t
```

### 3. Problemas de Performance
```bash
# Verificar uso de recursos
pm2 monit
htop

# Verificar logs de errores
pm2 logs tesoros-choco-backend
sudo tail -f /var/log/nginx/error.log
```

## 🔮 Futuras Mejoras del Despliegue

### 1. Containerización
- **Docker**: Para empaquetado y despliegue consistente
- **Docker Compose**: Para orquestación local
- **Kubernetes**: Para escalabilidad en producción

### 2. CI/CD Pipeline
- **GitHub Actions**: Para automatización de despliegue
- **Testing Automatizado**: Para validar cambios antes del despliegue
- **Rollback Automático**: Para recuperación rápida de problemas

### 3. Monitoreo Avanzado
- **Prometheus**: Para métricas del sistema
- **Grafana**: Para dashboards de monitoreo
- **Alerting**: Para notificaciones automáticas de problemas

---

Esta guía de despliegue proporciona instrucciones completas para desplegar Tesoros Chocó tanto en entornos de desarrollo como de producción, incluyendo configuración de servidores, SSL, monitoreo y mantenimiento del sistema.

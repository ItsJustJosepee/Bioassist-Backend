# 🚀 Guía de Setup - BioAssist Backend

Instrucciones paso a paso para llevar BioAssist a producción en Railway.

---

## ✅ Checklist Pre-Deployment

### 1. Clonar y Configurar Localmente

```bash
# Clonar proyecto
git clone <repository-url>
cd Bioassist-Backend

# Instalar dependencias
npm install

# Verificar compilación
npm run type-check
# Resultado esperado: ✅ Sin errores
```

### 2. Configurar Base de Datos en Railway

#### 2.1 Crear Proyecto en Railway

1. Ve a [Railway.app](https://railway.app)
2. Conecta tu cuenta GitHub
3. Crea nuevo proyecto → "Provision PostgreSQL"
4. Espera ~2-3 minutos a que se inicialice

#### 2.2 Obtener Connection String

1. En el dashboard de Railway, selecciona tu proyecto
2. Tab "PostgreSQL" → Botón "Connect"
3. Copia la variable `DATABASE_URL` completa
   - Formato: `postgresql://postgres:password@host:port/database`

#### 2.3 Crear Tablas e Índices

**Opción A: Railway CLI (Recomendado)**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Conectar a tu proyecto
railway login
railway link

# Ejecutar SQL
cat config/init.sql | railway run psql

# Verificar tablas creadas
railway run psql -c "\dt"
```

**Opción B: pgAdmin o DBeaver**

1. Descarga [DBeaver Community](https://dbeaver.io)
2. Nueva conexión PostgreSQL con datos de Railway
3. Abre archivo `config/init.sql` y ejecuta todo

**Opción C: psql (Command Line)**

```bash
# En tu terminal local
psql "postgresql://postgres:password@metro.proxy.rlwy.net:11742/railway" < config/init.sql

# Verificar
psql "postgresql://..." -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

**Resultado esperado:**
```
 table_name
────────────
 institutions
 locations
 users
 schedules
 attendance_logs
(5 rows)
```

---

## 🔑 Variables de Entorno

### Railway Variables

En el dashboard de Railway → Tab "Variables":

```env
DATABASE_URL=postgresql://postgres:...@metro.proxy.rlwy.net:11742/railway
NODE_ENV=production
PORT=3000
JWT_SECRET=<genera-un-string-aleatorio-fuerte>
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10
```

### Generar JWT_SECRET

En terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Usa el output como `JWT_SECRET`.

---

## 🚢 Deploy en Railway

### Método 1: Git Push (Automático)

```bash
# Asegúrate de tener el código versionado
git add .
git commit -m "BioAssist Backend - PostgreSQL migration"
git push

# Railway detecta cambios automáticamente y redeploy
# Monitorea en el dashboard: Deployments tab
```

### Método 2: Railway CLI (Manual)

```bash
railway up
# Sigue las instrucciones en terminal
```

### Monitorear Deploy

```bash
# Ver logs en tiempo real
railway logs --follow

# Resultado esperado (después de 30-60 segundos):
# 
# ✅ info: Environment set to [production]
# ✅ info: Database connected on port 11742
# ✅ info: Server started on port 3000
```

---

## 🧪 Testing Post-Deploy

### 1. Health Check

```bash
# Reemplaza RAILWAY_HOST con tu URL
curl https://bioassist-backend.up.railway.app/
# Esperado: HTML de landing page
```

### 2. Crear Usuario de Prueba

```bash
curl -X POST https://bioassist-backend.up.railway.app/api/users/add \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "tipo_usuario": "empleado",
    "id_institucion": "550e8400-e29b-41d4-a716-446655440000",
    "password_hash": "$2b$10$..."
  }'
```

### 3. Registrar Asistencia

```bash
curl -X POST https://bioassist-backend.up.railway.app/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "id_usuario": "550e8400-...",
    "latitud": -33.8688,
    "longitud": -51.9496,
    "info_dispositivo": "iPhone 13"
  }'
```

### 4. Consultar Resumen (ENDPOINT CLAVE)

```bash
curl -X GET "https://bioassist-backend.up.railway.app/api/attendance/summary/550e8400-...?fecha_inicio=2026-01-01&fecha_fin=2026-01-31" \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
```json
{
  "id_usuario": "550e8400-...",
  "resumen": [
    {
      "dia": "2026-01-31",
      "entrada": "2026-01-31T08:15:00Z",
      "salida": "2026-01-31T17:45:00Z",
      "horas_trabajadas": 9.5,
      "estado": "a_tiempo"
    }
  ],
  "total_horas": 45.5
}
```

---

## 🔄 Flujo de Trabajo de Desarrollo

### Cambios Locales

```bash
# 1. Hacer cambios en código
# 2. Verificar tipos
npm run type-check

# 3. Ejecutar tests (si hay)
npm test

# 4. Compilar
npm run build

# 5. Probar localmente
npm run dev:watch
```

### Deploy a Railway

```bash
# 1. Commit cambios
git add .
git commit -m "descripción clara del cambio"

# 2. Push (dispara deploy automático)
git push

# 3. Monitorear
railway logs --follow
```

### Rollback si hay Error

```bash
# Volver a commit anterior
git revert <commit-hash>
git push

# O usar Railway UI → Deployments → Redeploy previous version
```

---

## 🎯 Estructura de Datos Default

Para funcionar completamente, necesitas data inicial:

### 1. Crear Institución

```bash
INSERT INTO institutions (id_institucion, nombre, tipo, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Mi Empresa',
  'empresa',
  NOW(),
  NOW()
);
```

### 2. Crear Usuario

```bash
INSERT INTO users (
  id_usuario, nombre, email, tipo_usuario, id_institucion,
  password_hash, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Juan García',
  'juan@empresa.com',
  'empleado',
  '<id_institucion_del_paso_1>',
  '$2b$10$...',  -- hash bcrypt
  true,
  NOW(),
  NOW()
);
```

### 3. Crear Ubicación (Oficina)

```bash
INSERT INTO locations (
  id_ubicacion, id_institucion, nombre, 
  latitud, longitud, radio_geovalla, 
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '<id_institucion>',
  'Oficina Principal',
  -33.8688,
  -51.9496,
  100,  -- 100 metros
  NOW(),
  NOW()
);
```

### 4. Crear Horario

```bash
INSERT INTO schedules (
  id_horario, id_institucion,
  hora_entrada, hora_salida, flexibilidad_minutos,
  dias_laborales, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '<id_institucion>',
  '08:00:00'::time,
  '17:00:00'::time,
  10,  -- 10 minutos de flexibilidad
  ARRAY['lunes','martes','miercoles','jueves','viernes'],
  NOW(),
  NOW()
);
```

---

## 📊 Monitoreo en Producción

### Logs en Tiempo Real

```bash
railway logs --follow --tail 50
```

### Diagnóstico de Problemas

#### Error: "Relation 'users' does not exist"

```bash
# Significa que init.sql no se ejecutó
# Solución: Ejecutar init.sql nuevamente
```

#### Error: "connect ECONNREFUSED"

```bash
# Problema: DATABASE_URL inválida
# Solución: Verificar variable en Railway → Variables
```

#### Error: "JWT_SECRET is required"

```bash
# Falta variable de entorno
# Solución: Agregar JWT_SECRET en Railway → Variables
```

---

## 🔐 Secretos Seguros

**NUNCA** hagas commit de:
- `.env` files (ya están en `.gitignore` ✅)
- Contraseñas
- API keys
- Database URLs

Siempre usa Railway Variables o environment variables.

---

## 📈 Optimizaciones Futuras

- [ ] Agregar Redis para cache de sesiones
- [ ] Implementar CDN para assets estáticos
- [ ] Agregar alerting (Sentry/LogRocket)
- [ ] Implementar autoscaling
- [ ] Agregar rate limiting
- [ ] Configurar CORS específico

---

## 📞 Troubleshooting

### "502 Bad Gateway"

```
Railway está desplegando o hay error en la app
→ Espera 1-2 minutos
→ Revisa logs: railway logs --follow
→ Si persiste: git revert último commit
```

### "Error: connect ENOTFOUND metro.proxy.rlwy.net"

```
DNS no resuelve
→ Reinicia servidor: railway restart
→ Verifica DATABASE_URL en Railway UI
```

### "Compilation error"

```
npm run type-check localmente para saber qué está mal
git fix → git commit → git push
```

---

## ✅ Verificación Final

Ejecuta este checklist antes de declarar "Go Live":

- [ ] `npm run type-check` pasa sin errores
- [ ] Base de datos tiene 5 tablas creadas
- [ ] Variables de entorno están en Railway
- [ ] Deploy está en "success" state
- [ ] Endpoint `/api/attendance/summary/:id` retorna JSON correcto
- [ ] Logs no muestran errores críticos

---

**Siguientes pasos después del deployment:**

1. Configurar autenticación JWT (en auth middleware)
2. Implementar WebAuthn para biometría
3. Agregar validación de geofences
4. Crear dashboard de admin
5. Implementar notificaciones push

---

**Versión:** 1.0.0  
**Última actualización:** 2026-03-01  
**Mantenedor:** Miguel García

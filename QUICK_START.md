# ⚡ Quick Start - BioAssist Backend

Comienza en 5 minutos.

---

## ✅ Prerequisitos

```
Node.js 16+
PostgreSQL (Railway)
Git
```

---

## 🚀 5 Pasos

### 1️⃣ Clonar y Setup (2 min)

```bash
git clone <repo-url>
cd Bioassist-Backend
npm install
```

### 2️⃣ Variables de Entorno (1 min)

Railway te da una URL como:
```
postgresql://postgres:password@metro.proxy.rlwy.net:11742/railway
```

Cópiala en `config/.env.development`:
```env
DATABASE_URL=postgresql://postgres:...@metro.proxy.rlwy.net:11742/railway
NODE_ENV=development
PORT=3000
JWT_SECRET=my-secret-key
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10
```

### 3️⃣ Crear Tablas (1 min)

**Option A: Railway CLI (recomendado)**
```bash
npm install -g @railway/cli
railway login
railway link
cat config/init.sql | railway run psql
```

**Option B: pgAdmin o DBeaver**
- Abre `config/init.sql`
- Copia todo y ejecuta en Railway PostgreSQL

### 4️⃣ Verificar Compilación (30 seg)

```bash
npm run type-check
# Debería salir sin errores
```

### 5️⃣ Iniciar Servidor (30 seg)

```bash
npm run dev:watch
# ✅ Server running on http://localhost:3000
```

---

## 🧪 Test Rápido (30 seg)

En otra terminal:

```bash
# Crear usuario
curl -X POST http://localhost:3000/api/users/add \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "tipo_usuario": "empleado",
    "id_institucion": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Debería responder con 201 y el usuario creado
```

---

## 📁 Estructura Rápida

```
src/
├── models/        ← Tipos TypeScript
├── repos/         ← Acceso a datos (SQL)
├── services/      ← Lógica de negocio
├── routes/        ← Endpoints HTTP
├── common/        ← Utilidades & constantes
└── main.ts        ← Entry point
```

---

## 🎯 El Endpoint Clave

```bash
GET /api/attendance/summary/:id_usuario?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
```

Devuelve horas trabajadas calculadas **dinámicamente en la BD**.

---

## 📚 Documentación Completa

- [README.md](./README.md) - Visión general
- [API_REFERENCE.md](./API_REFERENCE.md) - Todos los endpoints
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Deploy a producción
- [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md) - Arquitectura (para seniors)
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Historia del proyecto

---

## 🆘 Ayuda Rápida

**Error: "no such table: users"**
```
→ Ejecuta config/init.sql nuevamente
```

**Error: "Error: connect ECONNREFUSED"**
```
→ DATABASE_URL incorrecta
→ Verifica que Railway esté corriendo
```

**Error: "TypeError" en TypeScript**
```
→ npm run type-check para ver el error específico
```

**¿Cómo agrego un nuevo endpoint?**
```
1. Crear modelo en src/models/
2. Crear repo en src/repos/
3. Crear service en src/services/
4. Crear route en src/routes/
5. Integrar en apiRouter.ts
→ Ver TECHNICAL_REFERENCE.md ejemplo completo
```

---

## 🎓 Próximos Pasos Después

1. Leer [API_REFERENCE.md](./API_REFERENCE.md) para entender endpoints
2. Revisar [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md) si vas a modificar código
3. Ver [SETUP_GUIDE.md](./SETUP_GUIDE.md) para deploy a Railway

---

**Versión:** 1.0.0 PostgreSQL  
**Status:** ✅ Listo para desarrollo

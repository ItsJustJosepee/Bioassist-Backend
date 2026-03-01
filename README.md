# BioAssist Backend - PWA Control de Asistencia

**Versión mejorada con PostgreSQL en la nube**

## 🎯 Introducción

BioAssist es el backend de una **Aplicación Web Progresiva (PWA)** para control de asistencia mediante:
- ✅ **Geolocalización** (GPS)
- ✅ **Biometría** (WebAuthn)
- ✅ **Horarios flexibles**
- ✅ **Instituciones** (Empresas/Escuelas)
- ✅ **Reportes de horas trabajadas con cálculo dinámico**

---

## 📦 Stack Tecnológico

```
Express.js + TypeScript    → API REST
PostgreSQL (Railway)       → Base de datos en la nube
pg (connection pool)       → Cliente nativo de PostgreSQL
UUID v4                    → Identificadores seguros
jet-logger & validators    → Utilidades
```

---

## 📊 Modelo de Datos

```
Institutions (empresas/escuelas)
    ├── Users (empleados/practicantes/estudiantes)
    ├── Locations (geofences)
    ├── Schedules (horarios)
    └── AttendanceLogs (registros de entrada/salida con cálculo de horas)
```

---

## 🚀 Instalación Rápida

### Prerequisitos
- Node.js >= 16
- npm/yarn
- Acceso a PostgreSQL (Railway)

### Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno ya están configuradas en config/.env.*

# 3. Inicializar BD (ejecutar una sola vez)
# Copia el contenido de config/init.sql en Railway PostgreSQL

# 4. Iniciar servidor en desarrollo
npm run dev:watch
```

---

## ⚡ Endpoints Principales

### Asistencia - ENDPOINT CLAVE

```http
GET /api/attendance/summary/:id_usuario?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
```

**Características:**
- Calcula automáticamente horas trabajadas: `(hora_salida - hora_entrada) / 3600`
- Valida usuario existe
- Filtra por rango de fechas
- Devuelve resumen diario + total

**Ejemplo de respuesta:**
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
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

### Otros Endpoints

```
# Usuarios
GET    /api/users/all
POST   /api/users/add
PUT    /api/users/update
DELETE /api/users/delete/:id

# Asistencia
POST   /api/attendance/check-in
POST   /api/attendance/check-out/:id
GET    /api/attendance/logs/user/:id_usuario

# Instituciones, ubicaciones, horarios
GET    /api/institutions/all
POST   /api/locations/add
GET    /api/schedules/all
```

---

## 📁 Estructura del Proyecto

```
src/
├── models/
│   ├── User.model.ts              (UUID, email, contraseña, institución)
│   ├── Institution.model.ts
│   ├── Location.model.ts          (geolocalización)
│   ├── Schedule.model.ts
│   └── AttendanceLog.model.ts
├── repos/
│   ├── Orm.ts                     (Pool PostgreSQL - 20 conexiones max)
│   ├── UserRepo.ts
│   ├── AttendanceLogRepo.ts       (🔑 getHoursSummary con SQL dinámico)
│   ├── InstitutionRepo.ts
│   ├── LocationRepo.ts
│   └── ScheduleRepo.ts
├── services/
│   ├── UserService.ts
│   └── AttendanceLogService.ts
├── routes/
│   ├── apiRouter.ts
│   ├── UserRoutes.ts
│   └── AttendanceLogRoutes.ts     (🔑 GET /summary implementado)
├── common/
│   ├── constants/
│   │   ├── env.ts                 (variables de entorno)
│   │   ├── Paths.ts               (rutas de API)
│   │   └── HttpStatusCodes.ts
│   └── utils/
│       ├── custom-validators.ts   (UUID, Email, ISO8601, etc.)
│       └── route-errors.ts
├── main.ts
└── server.ts
```

---

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor
npm run dev:watch        # Modo watch

# Compilación
npm run build            # Build para producción
npm run type-check       # Verificar tipos TypeScript
npm run lint             # ESLint
npm run format           # Prettier

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en watch
```

---

## 🔐 Variables de Entorno

Ubicadas en `config/.env.{environment}`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@metro.proxy.rlwy.net:11742/railway
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=10
```

---

## ✨ Características Destacadas

✅ **Cálculo dinámico de horas** - Database lo calcula, no el backend  
✅ **Pool de conexiones** - Máximo 20 conexiones simultáneas  
✅ **UUIDs** - Todos los IDs imposibles de adivinar  
✅ **Soft deletes** - Datos nunca se pierden  
✅ **Prepared statements** - Protección contra SQL injection  
✅ **TypeScript compilación** - Zero errores verificados  
✅ **Validaciones personalizadas** - UUID, Email, ISO8601, etc.

---

## 🛡️ Roadmap de Seguridad

- [ ] Implementar JWT token en rutas protegidas
- [ ] Implementar WebAuthn (biometría)
- [ ] Validar radio de geovalla en check-in
- [ ] Rate limiting en endpoints
- [ ] CORS configurado
- [x] Prepared statements
- [x] Validaciones de input

---

## 📚 Documentación Completa

Para detalles de la migración de JSON a PostgreSQL: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 👨‍💻 Patrón de Desarrollo

Todos los nuevos features siguen este patrón:

```
Routes (HTTP handlers)
    ↓
Services (lógica de negocio)
    ↓
Repos (acceso a datos)
    ↓
Models (tipos TypeScript)
```

---

## 🔍 Ejemplo Técnico: Resumen de Horas

El query SQL en `AttendanceLogRepo.ts`:

```sql
SELECT fecha, hora_entrada, hora_salida,
       EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600 AS horas_trabajadas,
       estado
FROM attendance_logs
WHERE id_usuario = $1 AND fecha BETWEEN $2 AND $3
ORDER BY fecha DESC
```

**Ventaja:** Cálculo en BD = máximo rendimiento

---

## 📞 Próximos Pasos

1. Ejecutar `config/init.sql` en Railway
2. Crear usuario de prueba: `POST /api/users/add`
3. Registrar asistencia: `POST /api/attendance/check-in`
4. Consultar resumen: `GET /api/attendance/summary/:id?fecha_inicio=...&fecha_fin=...`

---

**Base original:** [express-generator-typescript](https://github.com/seanpmaxwell/express-generator-typescript)  
**Versión:** 1.0.0 (PostgreSQL Migration)  
**Última actualización:** 2026-03-01

## Additional Notes

- If `npm run dev` gives you issues with bcrypt on MacOS you may need to run: `npm rebuild bcrypt --build-from-source`.

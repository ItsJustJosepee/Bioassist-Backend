# 📖 API Reference - BioAssist Backend

Documentación completa de todos los endpoints disponibles.

---

## Base URL

**Desarrollo:**
```
http://localhost:3000
```

**Producción (Railway):**
```
https://bioassist-backend.up.railway.app
```

---

## 📋 Autenticación

Todos los endpoints (excepto `/api/users/add`) requieren:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**TODO:** Implementar JWT middleware en rutas protegidas.

---

## 👥 Usuarios

### Listar todos los usuarios

```http
GET /api/users/all
```

**Respuesta 200:**
```json
{
  "usuarios": [
    {
      "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
      "nombre": "Juan García",
      "email": "juan@empresa.com",
      "tipo_usuario": "empleado",
      "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
      "is_active": true,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

**Códigos posibles:**
- `200` - Éxito
- `500` - Error del servidor

---

### Crear usuario

```http
POST /api/users/add
Content-Type: application/json

{
  "nombre": "string (minuto 3 caracteres)",
  "email": "string (válido y único)",
  "tipo_usuario": "empleado|practicante|estudiante",
  "id_institucion": "UUID válido",
  "password_hash": "string (hash bcrypt)"
}
```

**Respuesta 201:**
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440002",
  "nombre": "Laura Martínez",
  "email": "laura@empresa.com",
  "tipo_usuario": "empleado",
  "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
  "is_active": true,
  "created_at": "2026-01-20T14:45:00Z",
  "updated_at": "2026-01-20T14:45:00Z"
}
```

**Códigos posibles:**
- `201` - Usuario creado
- `400` - Datos inválidos (email duplicado, campos faltantes)
- `500` - Error del servidor

**Validaciones:**
- `nombre`: Mínimo 3 caracteres
- `email`: Formato válido y único en BD
- `tipo_usuario`: Solo valores enum permitidos
- `id_institucion`: UUID existe en tabla institutions

---

### Actualizar usuario

```http
PUT /api/users/update
Content-Type: application/json

{
  "id_usuario": "550e8400-...",
  "nombre": "string (opcional)",
  "email": "string (opcional)",
  "tipo_usuario": "enum (opcional)",
  "password_hash": "string (opcional)"
}
```

**Respuesta 200:**
```json
{
  "id_usuario": "550e8400-...",
  "nombre": "Juan García López",
  "email": "juan.garcia@empresa.com",
  "tipo_usuario": "empleado",
  "id_institucion": "550e8400-...",
  "is_active": true,
  "updated_at": "2026-01-20T15:00:00Z"
}
```

**Códigos posibles:**
- `200` - Actualización exitosa
- `404` - Usuario no encontrado
- `400` - Email ya existe
- `500` - Error del servidor

---

### Eliminar usuario (soft delete)

```http
DELETE /api/users/delete/:id_usuario
```

**Parámetros:**
- `id_usuario` (UUID): ID del usuario a eliminar

**Respuesta 204:**
```
(Sin contenido)
```

**Respuesta 404:**
```json
{
  "error": "Usuario no encontrado"
}
```

**Nota:** El usuario no se borra realmente, solo se marca como `is_active = false`.

---

## 🏢 Instituciones

### Listar instituciones

```http
GET /api/institutions/all
```

**Respuesta 200:**
```json
{
  "instituciones": [
    {
      "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
      "nombre": "Acme Corp",
      "tipo": "empresa",
      "created_at": "2026-01-10T08:00:00Z",
      "updated_at": "2026-01-10T08:00:00Z"
    }
  ]
}
```

---

### Crear institución

```http
POST /api/institutions/add
Content-Type: application/json

{
  "nombre": "string",
  "tipo": "empresa|escuela"
}
```

**Respuesta 201:**
```json
{
  "id_institucion": "550e8400-...",
  "nombre": "Tech School",
  "tipo": "escuela",
  "created_at": "2026-01-20T16:00:00Z",
  "updated_at": "2026-01-20T16:00:00Z"
}
```

---

## 📍 Ubicaciones / Geofences

### Listar ubicaciones

```http
GET /api/locations/all
```

**Respuesta 200:**
```json
{
  "ubicaciones": [
    {
      "id_ubicacion": "550e8400-e29b-41d4-a716-446655440003",
      "id_institucion": "550e8400-...",
      "nombre": "Oficina Principal",
      "latitud": -33.8688,
      "longitud": -51.9496,
      "radio_geovalla": 100,
      "created_at": "2026-01-15T09:00:00Z",
      "updated_at": "2026-01-15T09:00:00Z"
    }
  ]
}
```

---

### Crear ubicación

```http
POST /api/locations/add
Content-Type: application/json

{
  "id_institucion": "UUID",
  "nombre": "string",
  "latitud": "number (-90 a 90)",
  "longitud": "number (-180 a 180)",
  "radio_geovalla": "number (metros)"
}
```

**Ejemplo:**
```json
{
  "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
  "nombre": "Oficina San Isidro",
  "latitud": -34.4973,
  "longitud": -58.5160,
  "radio_geovalla": 150
}
```

**Respuesta 201:**
```json
{
  "id_ubicacion": "550e8400-...",
  "id_institucion": "550e8400-...",
  "nombre": "Oficina San Isidro",
  "latitud": -34.4973,
  "longitud": -58.5160,
  "radio_geovalla": 150,
  "created_at": "2026-01-20T16:30:00Z"
}
```

---

## ⏰ Horarios

### Listar horarios

```http
GET /api/schedules/all
```

**Respuesta 200:**
```json
{
  "horarios": [
    {
      "id_horario": "550e8400-e29b-41d4-a716-446655440004",
      "id_institucion": "550e8400-...",
      "hora_entrada": "08:00:00",
      "hora_salida": "17:00:00",
      "flexibilidad_minutos": 10,
      "dias_laborales": ["lunes", "martes", "miercoles", "jueves", "viernes"],
      "created_at": "2026-01-10T10:00:00Z",
      "updated_at": "2026-01-10T10:00:00Z"
    }
  ]
}
```

---

### Crear horario

```http
POST /api/schedules/add
Content-Type: application/json

{
  "id_institucion": "UUID",
  "hora_entrada": "HH:MM:SS",
  "hora_salida": "HH:MM:SS",
  "flexibilidad_minutos": "number",
  "dias_laborales": ["lunes", "martes", ...]
}
```

**Ejemplo:**
```json
{
  "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
  "hora_entrada": "09:00:00",
  "hora_salida": "18:00:00",
  "flexibilidad_minutos": 15,
  "dias_laborales": ["lunes", "martes", "miercoles", "jueves", "viernes"]
}
```

---

## 📊 Asistencia - ENDPOINTS PRINCIPALES

### 🔑 Resumen de Horas Trabajadas

```http
GET /api/attendance/summary/:id_usuario?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD
```

**Parámetros:**
- `id_usuario` (UUID): ID del usuario
- `fecha_inicio` (Date): Inicio del rango (YYYY-MM-DD)
- `fecha_fin` (Date): Fin del rango (YYYY-MM-DD)

**Respuesta 200:**
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-01-31",
  "resumen": [
    {
      "dia": "2026-01-31",
      "entrada": "2026-01-31T08:15:30Z",
      "salida": "2026-01-31T17:45:00Z",
      "horas_trabajadas": 9.49,
      "estado": "a_tiempo"
    },
    {
      "dia": "2026-01-30",
      "entrada": "2026-01-30T07:50:00Z",
      "salida": "2026-01-30T17:00:00Z",
      "horas_trabajadas": 9.17,
      "estado": "a_tiempo"
    },
    {
      "dia": "2026-01-29",
      "entrada": null,
      "salida": null,
      "horas_trabajadas": 0,
      "estado": "ausencia"
    }
  ],
  "total_horas": 45.5
}
```

**Validaciones:**
- `id_usuario` debe existir en BD
- `fecha_inicio` debe ser antes que `fecha_fin`
- Ambas fechas deben ser ISO8601 válidas

**Códigos posibles:**
- `200` - Éxito (incluye días sin marca)
- `400` - Fechas inválidas
- `404` - Usuario no encontrado
- `500` - Error del servidor

**Cálculo dinámico:**
```sql
EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600
```

---

### Registrar entrada (Check-in)

```http
POST /api/attendance/check-in
Content-Type: application/json

{
  "id_usuario": "UUID",
  "latitud": "number",
  "longitud": "number",
  "info_dispositivo": "string (opcional)"
}
```

**Ejemplo:**
```json
{
  "id_usuario": "550e8400-e29b-41d4-a716-446655440000",
  "latitud": -33.8688,
  "longitud": -51.9496,
  "info_dispositivo": "iPhone 13"
}
```

**Respuesta 201:**
```json
{
  "id_registro": "550e8400-e29b-41d4-a716-446655440005",
  "id_usuario": "550e8400-...",
  "fecha": "2026-01-20",
  "hora_entrada": "2026-01-20T08:15:30Z",
  "hora_salida": null,
  "latitud_entrada": -33.8688,
  "longitud_entrada": -51.9496,
  "estado": "activo",
  "created_at": "2026-01-20T08:15:30Z"
}
```

**Códigos posibles:**
- `201` - Check-in registrado
- `400` - Datos inválidos
- `404` - Usuario no encontrado
- `409` - Usuario ya tiene check-in activo (sin salida)
- `500` - Error del servidor

---

### Registrar salida (Check-out)

```http
POST /api/attendance/check-out/:id_registro
Content-Type: application/json

{
  "latitud": "number",
  "longitud": "number",
  "info_dispositivo": "string (opcional)"
}
```

**Parámetros:**
- `id_registro` (UUID): ID del registro de check-in

**Ejemplo:**
```json
{
  "latitud": -33.8688,
  "longitud": -51.9496,
  "info_dispositivo": "iPhone 13"
}
```

**Respuesta 200:**
```json
{
  "id_registro": "550e8400-e29b-41d4-a716-446655440005",
  "id_usuario": "550e8400-...",
  "fecha": "2026-01-20",
  "hora_entrada": "2026-01-20T08:15:30Z",
  "hora_salida": "2026-01-20T17:45:00Z",
  "latitud_salida": -33.8688,
  "longitud_salida": -51.9496,
  "horas_trabajadas": 9.49,
  "estado": "completado",
  "updated_at": "2026-01-20T17:45:00Z"
}
```

**Códigos posibles:**
- `200` - Check-out registrado
- `404` - Registro no encontrado o usuario sin entrada activa
- `500` - Error del servidor

---

### Listar registros de usuario

```http
GET /api/attendance/logs/user/:id_usuario?fecha=YYYY-MM-DD
```

**Parámetros:**
- `id_usuario` (UUID): ID del usuario
- `fecha` (Date, opcional): Filtrar por fecha específica

**Respuesta 200:**
```json
{
  "id_usuario": "550e8400-...",
  "registros": [
    {
      "id_registro": "550e8400-...",
      "fecha": "2026-01-20",
      "hora_entrada": "2026-01-20T08:15:30Z",
      "hora_salida": "2026-01-20T17:45:00Z",
      "horas_trabajadas": 9.49,
      "latitud_entrada": -33.8688,
      "longitud_entrada": -51.9496,
      "latitud_salida": -33.8688,
      "longitud_salida": -51.9496,
      "estado": "completado"
    },
    {
      "id_registro": "550e8400-...",
      "fecha": "2026-01-19",
      "hora_entrada": "2026-01-19T08:30:00Z",
      "hora_salida": "2026-01-19T17:00:00Z",
      "horas_trabajadas": 8.5,
      "estado": "completado"
    }
  ]
}
```

---

### Eliminar registro

```http
DELETE /api/attendance/logs/:id_registro
```

**Parámetros:**
- `id_registro` (UUID): ID del registro a eliminar

**Respuesta 204:**
```
(Sin contenido)
```

**Respuesta 404:**
```json
{
  "error": "Registro no encontrado"
}
```

---

## 🚨 Códigos de Respuesta HTTP

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 200 | ✅ Éxito | GET exitoso, UPDATE exitoso |
| 201 | ✅ Creado | Nuevo usuario/registro creado |
| 204 | ✅ Sin contenido | DELETE exitoso |
| 400 | ❌ Solicitud inválida | Datos faltantes, formato inválido |
| 404 | ❌ No encontrado | Usuario no existe, registro no existe |
| 409 | ⚠️ Conflicto | Email duplicado, check-in ya activo |
| 500 | 🔥 Error servidor | Bug en la app, error BD |

---

## 📝 Convenciones

### Formatos de Fecha/Hora

- **Fechas:** `YYYY-MM-DD` (ISO 8601)
- **Timestamps:** `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601 con zona UTC)
- **Horas:** `HH:MM:SS` (24 horas)

### IDs

- Todos los IDs (excepto legacy) son **UUID v4**
- Formato: `550e8400-e29b-41d4-a716-446655440000`

### Estados de Asistencia

- `activo` - Check-in registrado, aún no hay salida
- `completado` - Check-in + Check-out registrados
- `a_tiempo` - Llegó dentro de los horarios permitidos
- `retardo` - Llegó tarde
- `anomalia` - Datos inconsistentes (ej: salida sin entrada)
- `ausencia` - No tiene registro para ese día

### Tipos de Usuario

- `empleado` - Trabajador regular
- `practicante` - Estudiante en práctica
- `estudiante` - Estudiante asistiendo eventos

### Tipos de Institución

- `empresa` - Empresa/Negocio
- `escuela` - Institución educativa

---

## 🔒 Errores Comunes

### Email ya existe

```json
{
  "error": "Email ya registrado en la base de datos",
  "code": 400
}
```

**Solución:** Usa otro email o recupera la contraseña del usuario existente.

---

### Usuario no encontrado

```json
{
  "error": "Usuario no encontrado",
  "code": 404
}
```

**Solución:** Verifica que el UUID esté correcto y el usuario exista.

---

### Check-in ya activo

```json
{
  "error": "Usuario ya tiene un check-in activo sin cerrar",
  "code": 409
}
```

**Solución:** Registra check-out primero antes de hacer un nuevo check-in.

---

## 📚 Ejemplos Completos

### Workflow: Día de asistencia completo

```bash
# 1. Crear usuario
POST /api/users/add
{
  "nombre": "María López",
  "email": "maria@acmecorp.com",
  "tipo_usuario": "empleado",
  "id_institucion": "550e8400-e29b-41d4-a716-446655440001",
  "password_hash": "$2b$10$..."
}
→ Response: 201 Created, id_usuario = "abc123"

# 2. Check-in a las 8:15 AM
POST /api/attendance/check-in
{
  "id_usuario": "abc123",
  "latitud": -33.8688,
  "longitud": -51.9496
}
→ Response: 201 Created, id_registro = "def456"

# 3. Check-out a las 5:45 PM
POST /api/attendance/check-out/def456
{
  "latitud": -33.8688,
  "longitud": -51.9496
}
→ Response: 200 OK, horas_trabajadas = 9.5

# 4. Consultar resumen mensual
GET /api/attendance/summary/abc123?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
→ Response: 200 OK, total_horas = 186.5
```

---

**Versión:** 1.0.0  
**Última actualización:** 2026-03-01  
**Próxima review:** 2026-04-01

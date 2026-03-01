# 🔧 Technical Reference - BioAssist Backend

Guía técnica detallada para desarrolladores seniors y referencia de arquitectura.

---

## Tabla de Contenidos

1. Arquitectura de Capas
2. Patrones de Código
3. Base de Datos & Queries
4. Manejo de Errores
5. Validaciones Personalizadas
6. Pool de Conexiones
7. TypeScript & Compilación
8. Testing

---

## 1️⃣ Arquitectura de Capas

```
HTTP Request
    ↓
┌─────────────────────────────────────────┐
│  Routes (src/routes/*.ts)               │  ← Express handlers, validación básica
│  Responsabilidad: HTTP ↔ Objeto         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Services (src/services/*.ts)           │  ← Lógica de negocio
│  Responsabilidad: Reglas de negocio     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Repositories (src/repos/*.ts)          │  ← Data access layer
│  Responsabilidad: CRUD + Raw SQL        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Models (src/models/*.ts)               │  ← TypeScript interfaces
│  Responsabilidad: Definición de tipos   │
└─────────────────────────────────────────┘
    ↓
PostgreSQL Database
```

### Flujo de Datos Real: Resumen de Horas

```typescript
// 1. ROUTE (AttendanceLogRoutes.ts)
async function getSummary(req: Req, res: Res): Promise<void> {
    const id_usuario = req.params.id_usuario;  // "550e8400-..."
    const fecha_inicio = new Date(req.query.fecha_inicio);  // "2026-01-01"
    const fecha_fin = new Date(req.query.fecha_fin);        // "2026-01-31"
    
    const resumen = await AttendanceLogService.getHoursSummary(
        id_usuario, fecha_inicio, fecha_fin
    );
    
    const total_horas = resumen.reduce((sum, item) => 
        sum + item.horas_trabajadas, 0
    );
    
    res.status(200).json({
        id_usuario,
        resumen,
        total_horas: parseFloat(total_horas.toFixed(2))
    });
}

// 2. SERVICE (AttendanceLogService.ts)
async function getHoursSummary(
    id_usuario: string, 
    fecha_inicio: Date, 
    fecha_fin: Date
): Promise<IAttendanceLog[]> {
    // Validar reglas de negocio
    const userExists = await UserRepo.persists(id_usuario);
    if (!userExists) {
        throw new RouteError(404, 'Usuario no encontrado');
    }
    
    if (fecha_inicio > fecha_fin) {
        throw new RouteError(400, 'fecha_inicio debe ser anterior a fecha_fin');
    }
    
    // Delegar a repo
    return await AttendanceLogRepo.getHoursSummary(
        id_usuario, fecha_inicio, fecha_fin
    );
}

// 3. REPOSITORY (AttendanceLogRepo.ts)
async function getHoursSummary(
    id_usuario: string,
    fecha_inicio: Date,
    fecha_fin: Date
): Promise<any[]> {
    // Query con cálculo dinámico de horas
    const query = `
        SELECT 
            fecha,
            hora_entrada,
            hora_salida,
            EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600 
                AS horas_trabajadas,
            estado
        FROM attendance_logs
        WHERE id_usuario = $1 
            AND fecha BETWEEN $2 AND $3
        ORDER BY fecha DESC
    `;
    
    const result = await Orm.query(query, [id_usuario, fecha_inicio, fecha_fin]);
    
    // Mapear a interface
    return result.rows.map((row: any) => ({
        dia: row.fecha,
        entrada: row.hora_entrada,
        salida: row.hora_salida,
        horas_trabajadas: parseFloat(row.horas_trabajadas),
        estado: row.estado
    }));
}

// 4. MODEL (AttendanceLog.model.ts)
export interface IAttendanceLog {
    id_registro: string;           // UUID
    id_usuario: string;            // UUID FK
    fecha: Date;
    hora_entrada: Date | null;
    hora_salida: Date | null;
    latitud_entrada: number | null;
    longitud_entrada: number | null;
    latitud_salida: number | null;
    longitud_salida: number | null;
    horas_trabajadas?: number;    // Calculado dinámicamente
    estado: AttendanceStatus;
    created_at: Date;
    updated_at: Date;
}
```

**Principios:**
- ✅ Separación clara de responsabilidades
- ✅ Inyección de dependencias implícita (repos llamados en services)
- ✅ Validaciones en Service, no en Route
- ✅ SQL puro en Repos (no ORM)
- ✅ Tipos TypeScript en Models

---

## 2️⃣ Patrones de Código

### Pattern: CRUD Básico en Repo

```typescript
// repos/ExampleRepo.ts

// READ ONE
async function getOne(email: string): Promise<IExample | null> {
    const query = 'SELECT * FROM examples WHERE email = $1';
    const result = await Orm.query(query, [email]);
    return result.rows[0] || null;
}

// READ ALL
async function getAll(): Promise<IExample[]> {
    const query = 'SELECT * FROM examples ORDER BY created_at DESC';
    const result = await Orm.query(query);
    return result.rows;
}

// CREATE
async function add(example: IExample): Promise<IExample> {
    const query = `
        INSERT INTO examples (id_example, nombre, email, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
    `;
    const result = await Orm.query(query, [
        example.id_example,
        example.nombre,
        example.email
    ]);
    return result.rows[0];
}

// UPDATE
async function update(example: Partial<IExample>): Promise<void> {
    const query = `
        UPDATE examples 
        SET nombre = $1, email = $2, updated_at = NOW()
        WHERE id_example = $3
    `;
    await Orm.query(query, [
        example.nombre,
        example.email,
        example.id_example
    ]);
}

// DELETE (soft delete)
async function delete(id: string): Promise<void> {
    const query = `
        UPDATE examples
        SET is_active = false, updated_at = NOW()
        WHERE id_example = $1
    `;
    await Orm.query(query, [id]);
}

// EXISTS
async function persists(id: string): Promise<boolean> {
    const query = 'SELECT 1 FROM examples WHERE id_example = $1';
    const result = await Orm.query(query, [id]);
    return result.rows.length > 0;
}
```

### Pattern: Query Complejo con Agregación

```typescript
// Ejemplo: getTotalWorkedHoursByMonth
async function getTotalWorkedHoursByMonth(
    id_usuario: string,
    year: number,
    month: number
): Promise<number> {
    const query = `
        SELECT 
            COALESCE(
                SUM(EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600),
                0
            ) as total_horas
        FROM attendance_logs
        WHERE id_usuario = $1
            AND EXTRACT(YEAR FROM fecha) = $2
            AND EXTRACT(MONTH FROM fecha) = $3
            AND estado IN ('completado', 'a_tiempo', 'retardo')
    `;
    
    const result = await Orm.query(query, [
        id_usuario,
        year,
        month
    ]);
    
    return parseFloat(result.rows[0].total_horas);
}
```

### Pattern: Transacciones

```typescript
// services/UserService.ts

async function transferUserToInstitution(
    id_usuario: string,
    id_nueva_institucion: string
): Promise<void> {
    await Orm.withTransaction(async (client) => {
        try {
            // 1. Actualizar usuario
            await client.query(
                'UPDATE users SET id_institucion = $1 WHERE id_usuario = $2',
                [id_nueva_institucion, id_usuario]
            );
            
            // 2. Crear log de auditoría
            await client.query(
                'INSERT INTO audit_logs (id_usuario, accion, detalles) VALUES ($1, $2, $3)',
                [id_usuario, 'cambio_institucion', id_nueva_institucion]
            );
            
            // Si cualquier query falla, toda la transacción se revierte
        } catch (error) {
            throw new RouteError(500, 'Error transferencia de usuario');
        }
    });
}
```

---

## 3️⃣ Base de Datos & Queries

### Schema Overview

```sql
-- PostgreSQL UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Type Enum
CREATE TYPE user_type AS ENUM (
    'empleado',
    'practicante', 
    'estudiante'
);

-- Institution Type Enum
CREATE TYPE institution_type AS ENUM (
    'empresa',
    'escuela'
);

-- Attendance Status Enum
CREATE TYPE attendance_status AS ENUM (
    'activo',
    'completado',
    'a_tiempo',
    'retardo',
    'anomalia',
    'ausencia'
);

-- Main Tables
CREATE TABLE institutions (
    id_institucion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo institution_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    tipo_usuario user_type NOT NULL,
    id_institucion UUID NOT NULL REFERENCES institutions(id_institucion) ON DELETE CASCADE,
    password_hash VARCHAR(255),
    webauthn_credentials JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance_logs (
    id_registro UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES users(id_usuario) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIMESTAMP,
    hora_salida TIMESTAMP,
    latitud_entrada DOUBLE PRECISION,
    longitud_entrada DOUBLE PRECISION,
    latitud_salida DOUBLE PRECISION,
    longitud_salida DOUBLE PRECISION,
    estado attendance_status DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_institucion ON users(id_institucion);
CREATE INDEX idx_attendance_id_usuario ON attendance_logs(id_usuario);
CREATE INDEX idx_attendance_fecha ON attendance_logs(fecha);
CREATE INDEX idx_attendance_id_usuario_fecha ON attendance_logs(id_usuario, fecha);
```

### Query Patrones Comunes

#### 1. Horas Trabajadas en Rango de Fechas

```sql
SELECT 
    fecha,
    hora_entrada,
    hora_salida,
    EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600 as horas_trabajadas
FROM attendance_logs
WHERE id_usuario = $1 
    AND fecha BETWEEN $2 AND $3
    AND estado IN ('completado', 'a_tiempo', 'retardo')
ORDER BY fecha DESC;
```

**Explicación:**
- `EXTRACT(EPOCH FROM ...)` = Obtiene segundos entre dos timestamps
- `/ 3600` = Convierte segundos a horas
- Filtra solo registros válidos (excluye anomalías)

#### 2. Total Mensual

```sql
SELECT 
    DATE_TRUNC('month', fecha) as mes,
    COUNT(*) as dias_trabajados,
    SUM(EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600) as total_horas
FROM attendance_logs
WHERE id_usuario = $1
    AND EXTRACT(YEAR FROM fecha) = $2
    AND EXTRACT(MONTH FROM fecha) = $3
GROUP BY DATE_TRUNC('month', fecha);
```

#### 3. Retrasos en Mes

```sql
SELECT COUNT(*) as total_retardos
FROM attendance_logs
WHERE id_usuario = $1
    AND estado = 'retardo'
    AND EXTRACT(MONTH FROM fecha) = $2;
```

#### 4. Últimos 7 Días

```sql
SELECT *
FROM attendance_logs
WHERE id_usuario = $1
    AND fecha >= DATE(NOW()) - INTERVAL '7 days'
ORDER BY fecha DESC;
```

---

## 4️⃣ Manejo de Errores

### Route Error Class

```typescript
// common/utils/route-errors.ts

export class RouteError extends Error {
    public readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Uso en services
function validateUserExists(id_usuario: string): void {
    if (!isUUID(id_usuario)) {
        throw new RouteError(400, 'UUID inválido');
    }
}

// Catch en routes
async function getSummary(req: Req, res: Res): Promise<void> {
    try {
        const result = await AttendanceLogService.getHoursSummary(...);
        res.status(200).json(result);
    } catch (error) {
        if (error instanceof RouteError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
```

### Errores Comunes y Cómo Manejarse

```typescript
// JSON parse error
const data = JSON.parse(req.body);  // ¿Y si falla?
→ Siempre dentro de try/catch

// Type safety
const numero = parseInt(req.query.limit as string);
if (isNaN(numero)) {
    throw new RouteError(400, 'limit debe ser un número');
}

// Database errors
const result = await Orm.query(query, params);
if (result.rows.length === 0) {
    throw new RouteError(404, 'Registro no encontrado');
}

// UUID validation
if (!isUUID(req.params.id)) {
    throw new RouteError(400, 'ID debe ser UUID válido');
}
```

---

## 5️⃣ Validaciones Personalizadas

### Custom Validators (src/common/utils/custom-validators.ts)

```typescript
// Type predicates - permiten type narrowing en TypeScript

// UUID v4 Validator
export function isUUID(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

// Email Validator
export function isEmail(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ISO 8601 Date Validator
export function isISO8601(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return !isNaN(Date.parse(value));
}

// Time Format Validator (HH:MM:SS)
export function isTimeFormat(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(value);
}

// Enum Validator
export function isOneOf<T extends readonly string[]>(
    value: unknown,
    allowedValues: T
): value is T[number] {
    return typeof value === 'string' && allowedValues.includes(value);
}

// Uso en Models
export function isCompleteUser(obj: unknown): obj is IUser {
    if (typeof obj !== 'object' || obj === null) return false;
    const user = obj as any;
    
    return (
        isUUID(user.id_usuario) &&
        typeof user.nombre === 'string' &&
        isEmail(user.email) &&
        isOneOf(user.tipo_usuario, ['empleado', 'practicante', 'estudiante'])
    );
}
```

### Usage Pattern

```typescript
// En routes
async function addUser(req: Req, res: Res): Promise<void> {
    const { nombre, email, tipo_usuario } = req.body;
    
    // Validar tipos
    if (typeof nombre !== 'string' || nombre.length < 3) {
        throw new RouteError(400, 'nombre debe tener mínimo 3 caracteres');
    }
    
    if (!isEmail(email)) {
        throw new RouteError(400, 'email inválido');
    }
    
    if (!isOneOf(tipo_usuario, ['empleado', 'practicante', 'estudiante'])) {
        throw new RouteError(400, 'tipo_usuario no válido');
    }
    
    // ... continuar
}
```

---

## 6️⃣ Pool de Conexiones

### Orm.ts - Connection Pool Implementation

```typescript
// src/repos/Orm.ts

import { Pool, PoolClient, QueryResult } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,                    // Máximo 20 conexiones
    idleTimeoutMillis: 30000,   // Cierra después de 30s sin usar
    connectionTimeoutMillis: 2000
});

// Query básico
async function query(text: string, values?: any[]): Promise<QueryResult> {
    try {
        return await pool.query(text, values);
    } catch (error) {
        logger.err(error);
        throw new Error(`Database error: ${error.message}`);
    }
}

// Transacciones
async function withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Cleanup
async function closePool(): Promise<void> {
    await pool.end();
}

export const Orm = {
    getPool: () => pool,
    query,
    withTransaction,
    closePool
};
```

### Ventajas del Pool

```
1. Reutilización de conexiones
   ✅ Costo bajo de creación
   
2. Máximo de conexiones controladas
   ✅ PostgreSQL no se sobrecarga
   
3. Timeouts automáticos
   ✅ Conexiones muertas se limpian
   
4. Performance
   ✅ ~50-100x más rápido que crear conexión nueva cada vez
```

---

## 7️⃣ TypeScript & Compilación

### tsconfig.json Strategy

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Type Safety Patterns

```typescript
// ❌ MALO - Any everywhere
async function getUser(id: any): Promise<any> {
    return await Orm.query('SELECT * FROM users WHERE id = ?', [id]);
}

// ✅ BUENO - Fully typed
async function getUser(id: string): Promise<IUser | null> {
    if (!isUUID(id)) {
        throw new RouteError(400, 'Invalid UUID');
    }
    
    const result = await Orm.query(
        'SELECT * FROM users WHERE id_usuario = $1',
        [id]
    );
    
    const user = result.rows[0];
    
    if (!user || !isCompleteUser(user)) {
        return null;
    }
    
    return user;
}

// Type guards - permite type narrowing
function assertError(error: unknown): asserts error is Error {
    if (!(error instanceof Error)) {
        throw new Error('Expected an Error object');
    }
}
```

### Compilation Issues & Solutions

```bash
# Error: Property 'X' does not exist on type 'Y'
→ Falta propiedad en interface model

# Error: Type 'X' is not assignable to type 'Y'
→ Tipo devuelto no coincide con esperado
→ Probable causa: ID numérico vs UUID string

# Error: Cannot find module 'X'
→ npm install o ruta incorrecta
→ Verificar tsconfig paths si usa path mapping
```

---

## 8️⃣ Testing

### Test Structure (si existiera)

```typescript
// tests/attendance.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttendanceLogService } from '../src/services/AttendanceLogService';
import { AttendanceLogRepo } from '../src/repos/AttendanceLogRepo';

describe('AttendanceLogService', () => {
    describe('getHoursSummary', () => {
        it('debería calcular horas correctamente', async () => {
            const id_usuario = '550e8400-e29b-41d4-a716-446655440000';
            const fecha_inicio = new Date('2026-01-01');
            const fecha_fin = new Date('2026-01-31');
            
            const result = await AttendanceLogService.getHoursSummary(
                id_usuario,
                fecha_inicio,
                fecha_fin
            );
            
            expect(result).toBeDefined();
            expect(result).toHaveLength(greaterThan(0));
            expect(result[0]).toHaveProperty('horas_trabajadas');
            expect(result[0].horas_trabajadas).toBeGreaterThan(0);
        });
        
        it('debería lanzar error si usuario no existe', async () => {
            const id_usuario = '550e8400-0000-0000-0000-000000000000';
            
            expect(async () => {
                await AttendanceLogService.getHoursSummary(
                    id_usuario,
                    new Date('2026-01-01'),
                    new Date('2026-01-31')
                );
            }).toThrow();
        });
    });
});
```

### Test Database Strategy

```bash
# Usar .env.test con BD separada
DATABASE_URL=postgresql://...@.../database_test

# Cada test:
1. Seed datos iniciales
2. Correr test
3. Cleanup/Rollback
```

---

## 📊 Checklist de Código Nuevo

Cuando agregues feature nueva, verifica:

```
Modelo
  [ ] Interface definida
  [ ] Type guard/validator creado
  [ ] Enums si aplica
  
Repositorio
  [ ] Métodos CRUD básicos
  [ ] Queries parametrizados ($1, $2)
  [ ] Error handling
  [ ] Transacciones si es necesario
  
Servicio
  [ ] Validaciones de negocio
  [ ] Manejo de errores con RouteError
  [ ] Logs si es necesario
  [ ] Documentación de comportamiento
  
Ruta
  [ ] Validación de input
  [ ] Llamada a servicio
  [ ] Formato correcto de respuesta
  [ ] Manejo de errores
  
TypeScript
  [ ] npm run type-check pasa
  [ ] Sin 'any' a menos que sea necesario
  [ ] Tipos específicos, no genéricos
```

---

## 🎯 Performance Tips

```
1. Use índices en BD para columnas frecuentes
   → CREATE INDEX idx_name ON table(column)

2. Prepared statements siempre
   → Orm.query('... WHERE id = $1', [id])

3. LIMIT en queries de muchos registros
   → SELECT * FROM logs LIMIT 1000

4. Usar connection pool (ya implementado)
   → max: 20 conexiones

5. Aggregations en BD, no en código
   → SUM/AVG/COUNT en SQL

6. Paginate large datasets
   → OFFSET/LIMIT pattern
```

---

**Versión:** 1.0.0  
**Última actualización:** 2026-03-01  
**Audience:** Senior Backend Developers

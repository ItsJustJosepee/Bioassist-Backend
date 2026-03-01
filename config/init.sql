-- ============================================================================
-- BioAssist Database Initialization Script
-- PostgreSQL Database Schema
-- ============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS (Custom Types)
-- ============================================================================

-- User Type Enumeration
CREATE TYPE user_type_enum AS ENUM ('empleado', 'practicante', 'estudiante');

-- Institution Type Enumeration
CREATE TYPE institution_type_enum AS ENUM ('empresa', 'escuela');

-- Attendance Status Enumeration
CREATE TYPE attendance_status_enum AS ENUM ('a_tiempo', 'tarde', 'anomalia');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Institutions Table
CREATE TABLE institutions (
  id_institucion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_institucion VARCHAR(255) NOT NULL UNIQUE,
  tipo_institucion institution_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
  id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  tipo_usuario user_type_enum NOT NULL DEFAULT 'empleado',
  password_hash VARCHAR(255),
  webauthn_credentials JSONB,
  id_institucion UUID NOT NULL REFERENCES institutions(id_institucion) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations (Sitios/Ubicaciones) Table
CREATE TABLE locations (
  id_ubicacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_sitio VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  radio_geovalla INTEGER NOT NULL DEFAULT 100, -- en metros
  id_institucion UUID NOT NULL REFERENCES institutions(id_institucion) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules (Horarios) Table
CREATE TABLE schedules (
  id_horario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dias_laborales VARCHAR(7) NOT NULL DEFAULT 'LMXJVSD', -- L=Lunes, M=Martes, X=Miécoles, etc.
  rango_entrada_inicio TIME NOT NULL DEFAULT '08:00:00',
  rango_entrada_fin TIME NOT NULL DEFAULT '09:00:00',
  rango_salida_inicio TIME NOT NULL DEFAULT '17:00:00',
  rango_salida_fin TIME NOT NULL DEFAULT '18:00:00',
  flexibilidad INTEGER NOT NULL DEFAULT 15, -- en minutos
  id_institucion UUID NOT NULL REFERENCES institutions(id_institucion) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Logs Table (Registros de Asistencia)
CREATE TABLE attendance_logs (
  id_registro UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES users(id_usuario) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_entrada TIMESTAMP,
  hora_salida TIMESTAMP,
  coordenadas_registro JSONB, -- {"latitud": 19.123, "longitud": -99.456}
  evidencia_url VARCHAR(500),
  estado attendance_status_enum DEFAULT 'a_tiempo',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES (Optimizaciones de Búsqueda)
-- ============================================================================

-- Users Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_institucion ON users(id_institucion);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Locations Indexes
CREATE INDEX idx_locations_id_institucion ON locations(id_institucion);
CREATE INDEX idx_locations_coordenadas ON locations(latitud, longitud);

-- Schedules Indexes
CREATE INDEX idx_schedules_id_institucion ON schedules(id_institucion);

-- Attendance Logs Indexes
CREATE INDEX idx_attendance_logs_id_usuario ON attendance_logs(id_usuario);
CREATE INDEX idx_attendance_logs_fecha ON attendance_logs(fecha);
CREATE INDEX idx_attendance_logs_estado ON attendance_logs(estado);
CREATE INDEX idx_attendance_logs_usuario_fecha ON attendance_logs(id_usuario, fecha);

-- ============================================================================
-- INITIAL DATA (Datos de Prueba Opcionales)
-- ============================================================================

-- Insertar una institución de prueba
INSERT INTO institutions (nombre_institucion, tipo_institucion)
VALUES ('Instituto Tecnológico Federal', 'escuela')
ON CONFLICT DO NOTHING;

-- Obtener el ID de la institución para usarlo en los usuarios
-- DO $$
-- DECLARE
--   inst_id UUID;
-- BEGIN
--   INSERT INTO institutions (nombre_institucion, tipo_institucion)
--   VALUES ('Instituto Tecnológico Federal', 'escuela')
--   ON CONFLICT (nombre_institucion) DO NOTHING;
--   
--   SELECT id_institucion INTO inst_id FROM institutions WHERE nombre_institucion = 'Instituto Tecnológico Federal';
--   
--   -- Insertar usuarios de prueba
--   INSERT INTO users (nombre, email, tipo_usuario, id_institucion)
--   VALUES 
--     ('Miguel García', 'miguel@example.com', 'empleado', inst_id),
--     ('Juan Pérez', 'juan@example.com', 'practicante', inst_id),
--     ('María López', 'maria@example.com', 'estudiante', inst_id)
--   ON CONFLICT (email) DO NOTHING;
-- END $$;

-- ============================================================================
-- FUNCTIONS (Funciones útiles)
-- ============================================================================

-- Función para calcular las horas trabajadas en un día
CREATE OR REPLACE FUNCTION calculate_worked_hours(entrada TIMESTAMP, salida TIMESTAMP)
RETURNS DECIMAL AS $$
BEGIN
  IF entrada IS NULL OR salida IS NULL THEN
    RETURN 0;
  END IF;
  RETURN (EXTRACT(EPOCH FROM (salida - entrada)) / 3600)::DECIMAL(5, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF BIOASSIST DATABASE INITIALIZATION
-- ============================================================================

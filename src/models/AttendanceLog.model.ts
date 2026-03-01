import { isString } from 'jet-validators';
import { parseObject, Schema } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { isUUID } from '@src/common/utils/custom-validators';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

export enum AttendanceStatus {
  A_TIEMPO = 'a_tiempo',
  TARDE = 'tarde',
  ANOMALIA = 'anomalia',
}

const GetDefaults = (): IAttendanceLog => ({
  id_registro: '',
  id_usuario: '',
  fecha: new Date(),
  hora_entrada: null,
  hora_salida: null,
  coordenadas_registro: null,
  evidencia_url: null,
  estado: AttendanceStatus.A_TIEMPO,
  created_at: new Date(),
  updated_at: new Date(),
});

const schema: Schema<IAttendanceLog> = {
  id_registro: isUUID,
  id_usuario: isUUID,
  fecha: transformIsDate,
  hora_entrada: (val: unknown): val is Date | null => val === null || val instanceof Date,
  hora_salida: (val: unknown): val is Date | null => val === null || val instanceof Date,
  coordenadas_registro: (val: unknown): val is any => val === null || typeof val === 'object',
  evidencia_url: (val: unknown): val is string | null => val === null || typeof val === 'string',
  estado: isString,
  created_at: transformIsDate,
  updated_at: transformIsDate,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * Coordenadas de geolocalización
 */
export interface ICoordinates {
  latitud: number;
  longitud: number;
  accuracy?: number; // precisión en metros
}

/**
 * @entity attendance_logs
 */
export interface IAttendanceLog extends Entity {
  id_registro: string;
  id_usuario: string;
  fecha: Date;
  hora_entrada: Date | null;
  hora_salida: Date | null;
  coordenadas_registro: ICoordinates | null;
  evidencia_url: string | null;
  estado: AttendanceStatus | string;
  created_at: Date;
  updated_at: Date;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseAttendanceLog = parseObject<IAttendanceLog>(schema);

// Lightweight test - just check required fields
const isCompleteAttendanceLog = (obj: unknown): obj is IAttendanceLog => {
  if (typeof obj !== 'object' || obj === null) return false;
  const log = obj as any;
  return isUUID(log.id_usuario) && log.fecha instanceof Date;
};

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  GetDefaults,
  parseAttendanceLog,
  isCompleteAttendanceLog,
  AttendanceStatus,
} as const;


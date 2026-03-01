import { isString } from 'jet-validators';
import { parseObject, Schema } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { isUUID, isTimeFormat } from '@src/common/utils/custom-validators';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): ISchedule => ({
  id_horario: '',
  dias_laborales: 'LMXJV', // Lunes a Viernes
  rango_entrada_inicio: '08:00:00',
  rango_entrada_fin: '09:00:00',
  rango_salida_inicio: '17:00:00',
  rango_salida_fin: '18:00:00',
  flexibilidad: 15,
  id_institucion: '',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

const schema: Schema<ISchedule> = {
  id_horario: isUUID,
  dias_laborales: isString,
  rango_entrada_inicio: isTimeFormat,
  rango_entrada_fin: isTimeFormat,
  rango_salida_inicio: isTimeFormat,
  rango_salida_fin: isTimeFormat,
  flexibilidad: (val: unknown): val is number => typeof val === 'number',
  id_institucion: isUUID,
  is_active: (val: unknown): val is boolean => typeof val === 'boolean',
  created_at: transformIsDate,
  updated_at: transformIsDate,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity schedules
 */
export interface ISchedule extends Entity {
  id_horario: string;
  dias_laborales: string; // ej: "LMXJVSD"
  rango_entrada_inicio: string; // HH:MM:SS
  rango_entrada_fin: string;
  rango_salida_inicio: string;
  rango_salida_fin: string;
  flexibilidad: number; // en minutos
  id_institucion: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseSchedule = parseObject<ISchedule>(schema);

// Lighter weight test - just check required fields
const isCompleteSchedule = (obj: unknown): obj is ISchedule => {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as any;
  return (
    isString(s.dias_laborales) &&
    isTimeFormat(s.rango_entrada_inicio) &&
    isUUID(s.id_institucion)
  );
};

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  GetDefaults,
  parseSchedule,
  isCompleteSchedule,
} as const;

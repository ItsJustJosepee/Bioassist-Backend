import { isNumber, isString } from 'jet-validators';
import { parseObject, Schema } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { isUUID } from '@src/common/utils/custom-validators';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

const GetDefaults = (): ILocation => ({
  id_ubicacion: '',
  nombre_sitio: '',
  direccion: '',
  latitud: 0,
  longitud: 0,
  radio_geovalla: 100,
  id_institucion: '',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

const schema: Schema<ILocation> = {
  id_ubicacion: isUUID,
  nombre_sitio: isString,
  direccion: isString,
  latitud: isNumber,
  longitud: isNumber,
  radio_geovalla: isNumber,
  id_institucion: isUUID,
  is_active: (val: unknown): val is boolean => typeof val === 'boolean',
  created_at: transformIsDate,
  updated_at: transformIsDate,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity locations
 */
export interface ILocation extends Entity {
  id_ubicacion: string;
  nombre_sitio: string;
  direccion: string;
  latitud: number;
  longitud: number;
  radio_geovalla: number; // en metros
  id_institucion: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseLocation = parseObject<ILocation>(schema);

// Lighter weight test - just check required fields
const isCompleteLocation = (obj: unknown): obj is ILocation => {
  if (typeof obj !== 'object' || obj === null) return false;
  const l = obj as any;
  return (
    isString(l.nombre_sitio) &&
    isString(l.direccion) &&
    isNumber(l.latitud) &&
    isNumber(l.longitud) &&
    isNumber(l.radio_geovalla) &&
    isUUID(l.id_institucion)
  );
};

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  GetDefaults,
  parseLocation,
  isCompleteLocation,
} as const;

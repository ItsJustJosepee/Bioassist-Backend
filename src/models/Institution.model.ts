import { isNonEmptyString, isString } from 'jet-validators';
import { parseObject, Schema } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { isUUID } from '@src/common/utils/custom-validators';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

// Institution type enumeration
export enum InstitutionType {
  EMPRESA = 'empresa',
  ESCUELA = 'escuela',
}

const GetDefaults = (): IInstitution => ({
  id_institucion: '',
  nombre_institucion: '',
  tipo_institucion: InstitutionType.ESCUELA,
  created_at: new Date(),
  updated_at: new Date(),
});

const schema: Schema<IInstitution> = {
  id_institucion: isUUID,
  nombre_institucion: isString,
  tipo_institucion: isString,
  created_at: transformIsDate,
  updated_at: transformIsDate,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity institutions
 */
export interface IInstitution extends Entity {
  id_institucion: string;
  nombre_institucion: string;
  tipo_institucion: InstitutionType | string;
  created_at: Date;
  updated_at: Date;
}

/******************************************************************************
                                  Setup
******************************************************************************/

const parseInstitution = parseObject<IInstitution>(schema);

// Lighter weight test - just check required fields
const isCompleteInstitution = (obj: unknown): obj is IInstitution => {
  if (typeof obj !== 'object' || obj === null) return false;
  const i = obj as Record<string, unknown>;
  return isNonEmptyString(i.nombre_institucion) && isString(i.tipo_institucion);
};

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  GetDefaults,
  parseInstitution,
  isCompleteInstitution,
  InstitutionType,
} as const;

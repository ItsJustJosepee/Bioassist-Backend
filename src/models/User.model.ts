import { isNonEmptyString, isString } from 'jet-validators';
import { parseObject, Schema } from 'jet-validators/utils';

import { transformIsDate } from '@src/common/utils/validators';
import { isUUID, isEmail } from '@src/common/utils/custom-validators';

import { Entity } from './common/types';

/******************************************************************************
                                 Constants
******************************************************************************/

// User type enumeration
export enum UserType {
  EMPLEADO = 'empleado',
  PRACTICANTE = 'practicante',
  ESTUDIANTE = 'estudiante',
}

const GetDefaults = (): IUser => ({
  id_usuario: '',
  nombre: '',
  email: '',
  tipo_usuario: UserType.EMPLEADO,
  id_institucion: '',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

const schema: Schema<IUser> = {
  id_usuario: isUUID,
  nombre: isString,
  email: isEmail,
  tipo_usuario: isString,
  id_institucion: isUUID,
  password_hash: (val: unknown): val is string | undefined => val === undefined || isString(val),
  webauthn_credentials: (val: unknown): val is string | undefined => val === undefined || isString(val),
  is_active: (val: unknown): val is boolean => typeof val === 'boolean',
  created_at: transformIsDate,
  updated_at: transformIsDate,
};

/******************************************************************************
                                  Types
******************************************************************************/

/**
 * @entity users
 * User model para BioAssist
 */
export interface IUser extends Entity {
  id_usuario: string;
  nombre: string;
  email: string;
  tipo_usuario: UserType | string;
  id_institucion: string;
  password_hash?: string;
  webauthn_credentials?: string; // JSON stringified
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/******************************************************************************
                                  Setup
******************************************************************************/

// Set the "parseUser" function
const parseUser = parseObject<IUser>(schema);

// Lighter weight test - just check required fields
const isCompleteUser = (obj: unknown): obj is IUser => {
  if (typeof obj !== 'object' || obj === null) return false;
  const u = obj as Record<string, unknown>;
  return (
    isNonEmptyString(u.nombre) &&
    isEmail(u.email) &&
    isString(u.tipo_usuario) &&
    isUUID(u.id_institucion)
  );
};

/******************************************************************************
                               Export default
******************************************************************************/

export default {
  GetDefaults,
  parseUser,
  isCompleteUser,
  UserType,
} as const;

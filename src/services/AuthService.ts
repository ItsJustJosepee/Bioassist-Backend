import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import EnvVars from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import UserRepo from '@src/repos/UserRepo';
import { IUser } from '@src/models/User.model';

import { IJwtPayload } from '@src/routes/common/authMiddleware';

/******************************************************************************
                                  Functions
******************************************************************************/

/**
 * Login clásico con email y contraseña.
 * Retorna el token JWT y los datos del usuario.
 */
async function login(email: string, password_raw: string): Promise<{ token: string; user: IUser }> {
  // 1. Verificar si el usuario existe (UserRepo.getOne ya filtra por is_active = true)
  const user = await UserRepo.getOne(email);
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Credenciales inválidas');
  }

  // 2. Verificar que el usuario tenga una contraseña configurada
  if (!user.password_hash) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Credenciales inválidas');
  }

  // 3. Comparar la contraseña en texto plano contra el hash de la BD
  const pwdPassed = await bcrypt.compare(password_raw, user.password_hash);
  if (!pwdPassed) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Credenciales inválidas');
  }

  // 4. Armar el payload del JWT
  const payload: IJwtPayload = {
    id_usuario: user.id_usuario,
    tipo_usuario: user.tipo_usuario
  };

  // 5. Generar y firmar el token
  const token = jwt.sign(payload, EnvVars.JwtSecret, {
    expiresIn: EnvVars.JwtExpiration,
  });

  return { token, user };
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  login,
} as const;

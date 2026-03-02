import { NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import EnvVars from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';

import { Req, Res } from './express-types';

/******************************************************************************
                                 Constants
******************************************************************************/

export interface IJwtPayload {
  id_usuario: string;
  tipo_usuario: string;
}

/******************************************************************************
                                 Middleware
******************************************************************************/

/**
 * Middleware para validar el token JWT y establecer el payload en res.locals
 */
export function authMiddleware(req: Req, res: Res, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        'Token de autenticación no proporcionado o formato inválido'
      );
    }

    // Extraer el token separando "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new RouteError(
        HttpStatusCodes.UNAUTHORIZED,
        'Token vacío'
      );
    }

    // Verificar el token con la clave secreta
    const decoded = jwt.verify(token, EnvVars.JwtSecret) as IJwtPayload;

    // Almacenar el payload en res.locals para que los siguientes controladores lo usen (res.locals.sessionUser)
    res.locals.sessionUser = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Token inválido o expirado'));
    } else {
      next(error);
    }
  }
}

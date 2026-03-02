import { isString } from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { isEmail } from '@src/common/utils/custom-validators';
import AuthService from '@src/services/AuthService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';

/******************************************************************************
                                 Constants
******************************************************************************/

// Aprovechamos parseReq para validar el body de forma estricta
const reqValidators = {
  login: parseReq({
    email: isEmail,
    password: isString,
  }),
} as const;

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Endpoint para hacer Login Clásico.
 *
 * @route POST /api/auth/login
 */
async function login(req: Req, res: Res): Promise<void> {
  const { email, password } = reqValidators.login(req.body);

  const result = await AuthService.login(email, password);

  res.status(HttpStatusCodes.OK).json(result);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  login,
} as const;

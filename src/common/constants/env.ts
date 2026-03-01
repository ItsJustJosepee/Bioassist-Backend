import jetEnv, { num } from 'jet-env';
import { isOneOf } from '@src/common/utils/custom-validators';

/******************************************************************************
                                 Constants
******************************************************************************/

// NOTE: These need to match the names of your ".env" files
export const NodeEnvs = {
  DEV: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

/******************************************************************************
                                 Setup
******************************************************************************/

const EnvVars = jetEnv({
  NodeEnv: isOneOf('development', 'test', 'production'),
  Port: num,
  DatabaseUrl: String,
  JwtSecret: String,
  JwtExpiration: String,
  BcryptRounds: num,
});

/******************************************************************************
                            Export default
******************************************************************************/

export default EnvVars;

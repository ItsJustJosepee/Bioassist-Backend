/**
 * PostgreSQL Database Connection Pool
 * Reemplaza a MockOrm.ts - Conexión real a PostgreSQL en Railway
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

import EnvVars from '@src/common/constants/env';
import logger from 'jet-logger';

/******************************************************************************
                                Constants
******************************************************************************/

// Pool de conexiones singleton a PostgreSQL
let pool: Pool | null = null;

/******************************************************************************
                            Database Connection Pool
******************************************************************************/

/**
 * Inicializa el pool de conexiones a PostgreSQL.
 * Se crea una sola vez y se reutiliza en toda la aplicación.
 */
function initializePool(): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: EnvVars.DatabaseUrl,
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Timeout de conexión inactiva (30s)
    connectionTimeoutMillis: 2000, // Timeout al conectar (2s)
  });

  pool.on('error', (err: Error) => {
    logger.err(`Unexpected error on idle client: ${String(err)}`);
    process.exit(-1);
  });

  logger.info('PostgreSQL connection pool initialized');

  return pool;
}

/**
 * Obtiene el pool de conexiones existente o lo crea.
 */
function getPool(): Pool {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Retorna un cliente del pool para ejecutar transacciones o queries personalizadas.
 */
async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Ejecuta una query simple contra la base de datos.
 * @param text - Texto de la query SQL
 * @param values - Parámetros para la query (evita SQL injection)
 * @returns Resultado de la query
 */
async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, values);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    } else {
      logger.info(`Query executed in ${duration}ms`);
    }

    return result;
  } catch (err) {
    logger.err(`Database query error: ${text} - ${String(err)}`);
    throw err;
  }
}

/**
 * Ejecuta múltiples queries dentro de una transacción.
 * @param callback - Función que contiene las queries a ejecutar
 */
async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.err(`Transaction rolled back due to error: ${String(err)}`);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cierra todas las conexiones del pool.
 * Útil para testing o graceful shutdown.
 */
async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL connection pool closed');
  }
}

/**
 * Limpia sin cerrar (para tests).
 */
function resetPool(): void {
  // Aquí podrías ejecutar TRUNCATE TABLE si necesitas limpiar datos
  logger.info('Pool reset for testing');
}

/******************************************************************************
                                Export
******************************************************************************/

export default {
  getPool,
  getClient,
  query,
  withTransaction,
  closePool,
  resetPool,
} as const;

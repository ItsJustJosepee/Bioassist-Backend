import { v4 as uuidv4 } from 'uuid';

import { IUser } from '@src/models/User.model';

import Orm from './Orm';

/******************************************************************************
                                Constants
******************************************************************************/

const TABLE = 'users';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one user by email.
 */
async function getOne(email: string): Promise<IUser | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE email = $1 AND is_active = true
    LIMIT 1
  `;

  const result = await Orm.query<IUser>(query, [email]);
  return result.rows[0] || null;
}

/**
 * Get one user by ID.
 */
async function getOneById(id_usuario: string): Promise<IUser | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_usuario = $1 AND is_active = true
    LIMIT 1
  `;

  const result = await Orm.query<IUser>(query, [id_usuario]);
  return result.rows[0] || null;
}

/**
 * Check if a user with the given id exists.
 */
async function persists(id_usuario: string): Promise<boolean> {
  const query = `
    SELECT 1 FROM ${TABLE}
    WHERE id_usuario = $1 AND is_active = true
    LIMIT 1
  `;

  const result = await Orm.query<Record<string, unknown>>(query, [id_usuario]);
  return result.rows.length > 0;
}

/**
 * Get all users (active only).
 */
async function getAll(): Promise<IUser[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE is_active = true
    ORDER BY created_at DESC
  `;

  const result = await Orm.query<IUser>(query);
  return result.rows;
}

/**
 * Get all users by institution.
 */
async function getAllByInstitution(id_institucion: string): Promise<IUser[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_institucion = $1 AND is_active = true
    ORDER BY nombre ASC
  `;

  const result = await Orm.query<IUser>(query, [id_institucion]);
  return result.rows;
}

/**
 * Add one user.
 */
async function add(user: IUser): Promise<IUser> {
  const id_usuario = uuidv4();

  const query = `
    INSERT INTO ${TABLE} (
      id_usuario,
      nombre,
      email,
      tipo_usuario,
      id_institucion,
      password_hash,
      webauthn_credentials,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id_usuario,
    user.nombre,
    user.email,
    user.tipo_usuario,
    user.id_institucion,
    user.password_hash || null,
    user.webauthn_credentials || null,
    user.is_active !== undefined ? user.is_active : true,
  ];

  const result = await Orm.query<IUser>(query, values);
  return result.rows[0];
}

/**
 * Update a user.
 */
async function update(user: IUser): Promise<IUser | null> {
  const exists = await persists(user.id_usuario);
  if (!exists) {
    return null;
  }

  const query = `
    UPDATE ${TABLE}
    SET
      nombre = $2,
      email = $3,
      tipo_usuario = $4,
      password_hash = $5,
      webauthn_credentials = $6,
      is_active = $7,
      updated_at = NOW()
    WHERE id_usuario = $1
    RETURNING *
  `;

  const values = [
    user.id_usuario,
    user.nombre,
    user.email,
    user.tipo_usuario,
    user.password_hash || null,
    user.webauthn_credentials || null,
    user.is_active !== undefined ? user.is_active : true,
  ];

  const result = await Orm.query<IUser>(query, values);
  return result.rows[0] || null;
}

/**
 * Soft delete one user (marks as inactive).
 */
async function delete_(id_usuario: string): Promise<boolean> {
  const query = `
    UPDATE ${TABLE}
    SET is_active = false, updated_at = NOW()
    WHERE id_usuario = $1
    RETURNING id_usuario
  `;

  const result = await Orm.query<{ id_usuario: string }>(query, [id_usuario]);
  return result.rows.length > 0;
}

/**
 * Hard delete one user (permanent deletion).
 */
async function hardDelete(id_usuario: string): Promise<boolean> {
  const query = `
    DELETE FROM ${TABLE}
    WHERE id_usuario = $1
    RETURNING id_usuario
  `;

  const result = await Orm.query<{ id_usuario: string }>(query, [id_usuario]);
  return result.rows.length > 0;
}

/**
 * Update user password hash.
 */
async function updatePassword(
  id_usuario: string,
  password_hash: string,
): Promise<boolean> {
  const query = `
    UPDATE ${TABLE}
    SET password_hash = $2, updated_at = NOW()
    WHERE id_usuario = $1 AND is_active = true
    RETURNING id_usuario
  `;

  const result = await Orm.query<{ id_usuario: string }>(query, [id_usuario, password_hash]);
  return result.rows.length > 0;
}

/**
 * Update user WebAuthn credentials.
 */
async function updateWebAuthnCredentials(
  id_usuario: string,
  credentials: string,
): Promise<boolean> {
  const query = `
    UPDATE ${TABLE}
    SET webauthn_credentials = $2, updated_at = NOW()
    WHERE id_usuario = $1 AND is_active = true
    RETURNING id_usuario
  `;

  const result = await Orm.query<{ id_usuario: string }>(query, [id_usuario, credentials]);
  return result.rows.length > 0;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOne,
  getOneById,
  persists,
  getAll,
  getAllByInstitution,
  add,
  update,
  delete: delete_,
  hardDelete,
  updatePassword,
  updateWebAuthnCredentials,
} as const;


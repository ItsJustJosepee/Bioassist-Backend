import { v4 as uuidv4 } from 'uuid';

import { IInstitution } from '@src/models/Institution.model';

import Orm from './Orm';

/******************************************************************************
                                Constants
******************************************************************************/

const TABLE = 'institutions';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one institution by ID.
 */
async function getOneById(id_institucion: string): Promise<IInstitution | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_institucion = $1
    LIMIT 1
  `;

  const result = await Orm.query<IInstitution>(query, [id_institucion]);
  return result.rows[0] || null;
}

/**
 * Get all institutions.
 */
async function getAll(): Promise<IInstitution[]> {
  const query = `
    SELECT * FROM ${TABLE}
    ORDER BY nombre_institucion ASC
  `;

  const result = await Orm.query<IInstitution>(query);
  return result.rows;
}

/**
 * Add one institution.
 */
async function add(institution: IInstitution): Promise<IInstitution> {
  const id_institucion = uuidv4();

  const query = `
    INSERT INTO ${TABLE} (
      id_institucion,
      nombre_institucion,
      tipo_institucion,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *
  `;

  const values = [id_institucion, institution.nombre_institucion, institution.tipo_institucion];

  const result = await Orm.query<IInstitution>(query, values);
  return result.rows[0];
}

/**
 * Update an institution.
 */
async function update(institution: IInstitution): Promise<IInstitution | null> {
  const query = `
    UPDATE ${TABLE}
    SET
      nombre_institucion = $2,
      tipo_institucion = $3,
      updated_at = NOW()
    WHERE id_institucion = $1
    RETURNING *
  `;

  const values = [
    institution.id_institucion,
    institution.nombre_institucion,
    institution.tipo_institucion,
  ];

  const result = await Orm.query<IInstitution>(query, values);
  return result.rows[0] || null;
}

/**
 * Delete one institution.
 */
async function delete_(id_institucion: string): Promise<boolean> {
  const query = `
    DELETE FROM ${TABLE}
    WHERE id_institucion = $1
    RETURNING id_institucion
  `;

  const result = await Orm.query<{ id_institucion: string }>(query, [id_institucion]);
  return result.rows.length > 0;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOneById,
  getAll,
  add,
  update,
  delete: delete_,
} as const;

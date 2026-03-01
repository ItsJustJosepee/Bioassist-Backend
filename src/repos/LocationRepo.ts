import { v4 as uuidv4 } from 'uuid';

import { ILocation } from '@src/models/Location.model';

import Orm from './Orm';

/******************************************************************************
                                Constants
******************************************************************************/

const TABLE = 'locations';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one location by ID.
 */
async function getOneById(id_ubicacion: string): Promise<ILocation | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_ubicacion = $1 AND is_active = true
    LIMIT 1
  `;

  const result = await Orm.query(query, [id_ubicacion]);
  return result.rows[0] || null;
}

/**
 * Get all locations for an institution.
 */
async function getByInstitution(id_institucion: string): Promise<ILocation[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_institucion = $1 AND is_active = true
    ORDER BY nombre_sitio ASC
  `;

  const result = await Orm.query(query, [id_institucion]);
  return result.rows;
}

/**
 * Get all active locations.
 */
async function getAll(): Promise<ILocation[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE is_active = true
    ORDER BY nombre_sitio ASC
  `;

  const result = await Orm.query(query);
  return result.rows;
}

/**
 * Add one location.
 */
async function add(location: ILocation): Promise<ILocation> {
  const id_ubicacion = uuidv4();

  const query = `
    INSERT INTO ${TABLE} (
      id_ubicacion,
      nombre_sitio,
      direccion,
      latitud,
      longitud,
      radio_geovalla,
      id_institucion,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id_ubicacion,
    location.nombre_sitio,
    location.direccion,
    location.latitud,
    location.longitud,
    location.radio_geovalla,
    location.id_institucion,
    location.is_active || true,
  ];

  const result = await Orm.query(query, values);
  return result.rows[0];
}

/**
 * Update a location.
 */
async function update(location: ILocation): Promise<ILocation | null> {
  const query = `
    UPDATE ${TABLE}
    SET
      nombre_sitio = $2,
      direccion = $3,
      latitud = $4,
      longitud = $5,
      radio_geovalla = $6,
      is_active = $7,
      updated_at = NOW()
    WHERE id_ubicacion = $1
    RETURNING *
  `;

  const values = [
    location.id_ubicacion,
    location.nombre_sitio,
    location.direccion,
    location.latitud,
    location.longitud,
    location.radio_geovalla,
    location.is_active || true,
  ];

  const result = await Orm.query(query, values);
  return result.rows[0] || null;
}

/**
 * Soft delete a location (mark as inactive).
 */
async function delete_(id_ubicacion: string): Promise<boolean> {
  const query = `
    UPDATE ${TABLE}
    SET is_active = false, updated_at = NOW()
    WHERE id_ubicacion = $1
    RETURNING id_ubicacion
  `;

  const result = await Orm.query(query, [id_ubicacion]);
  return result.rows.length > 0;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOneById,
  getByInstitution,
  getAll,
  add,
  update,
  delete: delete_,
} as const;

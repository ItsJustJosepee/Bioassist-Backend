import { v4 as uuidv4 } from 'uuid';

import { ISchedule } from '@src/models/Schedule.model';

import Orm from './Orm';

/******************************************************************************
                                Constants
******************************************************************************/

const TABLE = 'schedules';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one schedule by ID.
 */
async function getOneById(id_horario: string): Promise<ISchedule | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_horario = $1 AND is_active = true
    LIMIT 1
  `;

  const result = await Orm.query(query, [id_horario]);
  return result.rows[0] || null;
}

/**
 * Get all schedules for an institution.
 */
async function getByInstitution(id_institucion: string): Promise<ISchedule[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_institucion = $1 AND is_active = true
    ORDER BY created_at DESC
  `;

  const result = await Orm.query(query, [id_institucion]);
  return result.rows;
}

/**
 * Get all active schedules.
 */
async function getAll(): Promise<ISchedule[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE is_active = true
    ORDER BY created_at DESC
  `;

  const result = await Orm.query(query);
  return result.rows;
}

/**
 * Add one schedule.
 */
async function add(schedule: ISchedule): Promise<ISchedule> {
  const id_horario = uuidv4();

  const query = `
    INSERT INTO ${TABLE} (
      id_horario,
      dias_laborales,
      rango_entrada_inicio,
      rango_entrada_fin,
      rango_salida_inicio,
      rango_salida_fin,
      flexibilidad,
      id_institucion,
      is_active,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id_horario,
    schedule.dias_laborales,
    schedule.rango_entrada_inicio,
    schedule.rango_entrada_fin,
    schedule.rango_salida_inicio,
    schedule.rango_salida_fin,
    schedule.flexibilidad,
    schedule.id_institucion,
    schedule.is_active || true,
  ];

  const result = await Orm.query(query, values);
  return result.rows[0];
}

/**
 * Update a schedule.
 */
async function update(schedule: ISchedule): Promise<ISchedule | null> {
  const query = `
    UPDATE ${TABLE}
    SET
      dias_laborales = $2,
      rango_entrada_inicio = $3,
      rango_entrada_fin = $4,
      rango_salida_inicio = $5,
      rango_salida_fin = $6,
      flexibilidad = $7,
      is_active = $8,
      updated_at = NOW()
    WHERE id_horario = $1
    RETURNING *
  `;

  const values = [
    schedule.id_horario,
    schedule.dias_laborales,
    schedule.rango_entrada_inicio,
    schedule.rango_entrada_fin,
    schedule.rango_salida_inicio,
    schedule.rango_salida_fin,
    schedule.flexibilidad,
    schedule.is_active || true,
  ];

  const result = await Orm.query(query, values);
  return result.rows[0] || null;
}

/**
 * Soft delete a schedule (mark as inactive).
 */
async function delete_(id_horario: string): Promise<boolean> {
  const query = `
    UPDATE ${TABLE}
    SET is_active = false, updated_at = NOW()
    WHERE id_horario = $1
    RETURNING id_horario
  `;

  const result = await Orm.query(query, [id_horario]);
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

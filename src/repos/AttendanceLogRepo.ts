import { v4 as uuidv4 } from 'uuid';

import { IAttendanceLog } from '@src/models/AttendanceLog.model';

import Orm from './Orm';

/******************************************************************************
                                Constants
******************************************************************************/

const TABLE = 'attendance_logs';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get one attendance log by ID.
 */
async function getOneById(id_registro: string): Promise<IAttendanceLog | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_registro = $1
    LIMIT 1
  `;

  const result = await Orm.query(query, [id_registro]);
  return result.rows[0] || null;
}

/**
 * Get all attendance logs for a user.
 */
async function getByUser(id_usuario: string): Promise<IAttendanceLog[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_usuario = $1
    ORDER BY fecha DESC, hora_entrada DESC
  `;

  const result = await Orm.query(query, [id_usuario]);
  return result.rows;
}

/**
 * Get attendance logs for a user on a specific date.
 */
async function getByUserAndDate(
  id_usuario: string,
  fecha: Date,
): Promise<IAttendanceLog[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_usuario = $1 AND fecha = $2
    ORDER BY hora_entrada DESC
  `;

  const result = await Orm.query(query, [id_usuario, fecha]);
  return result.rows;
}

/**
 * Get attendance logs for a user between dates.
 */
async function getByUserBetweenDates(
  id_usuario: string,
  fecha_inicio: Date,
  fecha_fin: Date,
): Promise<IAttendanceLog[]> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_usuario = $1 AND fecha BETWEEN $2 AND $3
    ORDER BY fecha DESC, hora_entrada DESC
  `;

  const result = await Orm.query(query, [
    id_usuario,
    fecha_inicio,
    fecha_fin,
  ]);
  return result.rows;
}

/**
 * Add one attendance log (check-in).
 */
async function add(log: IAttendanceLog): Promise<IAttendanceLog> {
  const id_registro = uuidv4();

  const query = `
    INSERT INTO ${TABLE} (
      id_registro,
      id_usuario,
      fecha,
      hora_entrada,
      coordenadas_registro,
      evidencia_url,
      estado,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `;

  const values = [
    id_registro,
    log.id_usuario,
    log.fecha,
    log.hora_entrada || null,
    log.coordenadas_registro ? JSON.stringify(log.coordenadas_registro) : null,
    log.evidencia_url || null,
    log.estado || 'a_tiempo',
  ];

  const result = await Orm.query(query, values);
  return result.rows[0];
}

/**
 * Update attendance log (check-out).
 */
async function update(log: IAttendanceLog): Promise<IAttendanceLog | null> {
  const query = `
    UPDATE ${TABLE}
    SET
      hora_salida = $2,
      estado = $3,
      updated_at = NOW()
    WHERE id_registro = $1
    RETURNING *
  `;

  const values = [
    log.id_registro,
    log.hora_salida || null,
    log.estado || 'a_tiempo',
  ];

  const result = await Orm.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete one attendance log.
 */
async function delete_(id_registro: string): Promise<boolean> {
  const query = `
    DELETE FROM ${TABLE}
    WHERE id_registro = $1
    RETURNING id_registro
  `;

  const result = await Orm.query(query, [id_registro]);
  return result.rows.length > 0;
}

/**
 * Calculate worked hours summary for a user in a date range.
 * Query dinámico que calcula las horas trabajadas (resta de entrada/salida).
 */
async function getHoursSummary(
  id_usuario: string,
  fecha_inicio: Date,
  fecha_fin: Date,
): Promise<
  {
    fecha: Date;
    hora_entrada: Date | null;
    hora_salida: Date | null;
    horas_trabajadas: number;
    estado: string;
  }[]
> {
  const query = `
    SELECT
      fecha,
      hora_entrada,
      hora_salida,
      EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600 AS horas_trabajadas,
      estado
    FROM ${TABLE}
    WHERE id_usuario = $1 AND fecha BETWEEN $2 AND $3
    ORDER BY fecha DESC
  `;

  const result = await Orm.query(query, [
    id_usuario,
    fecha_inicio,
    fecha_fin,
  ]);

  return result.rows.map((row: any) => ({
    fecha: row.fecha,
    hora_entrada: row.hora_entrada,
    hora_salida: row.hora_salida,
    horas_trabajadas: row.horas_trabajadas ? parseFloat(row.horas_trabajadas) : 0,
    estado: row.estado,
  }));
}

/**
 * Get total worked hours for a user (all time or in a period).
 */
async function getTotalWorkedHours(
  id_usuario: string,
  fecha_inicio?: Date,
  fecha_fin?: Date,
): Promise<number> {
  let query = `
    SELECT
      COALESCE(SUM(EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600), 0) AS total_hours
    FROM ${TABLE}
    WHERE id_usuario = $1 AND hora_entrada IS NOT NULL AND hora_salida IS NOT NULL
  `;

  const values: any[] = [id_usuario];

  if (fecha_inicio && fecha_fin) {
    query += ` AND fecha BETWEEN $2 AND $3`;
    values.push(fecha_inicio, fecha_fin);
  }

  const result = await Orm.query(query, values);
  return result.rows[0]?.total_hours || 0;
}

/**
 * Get today's check-in for a user.
 */
async function getTodayCheckIn(id_usuario: string): Promise<IAttendanceLog | null> {
  const query = `
    SELECT * FROM ${TABLE}
    WHERE id_usuario = $1 AND fecha = CURRENT_DATE
    LIMIT 1
  `;

  const result = await Orm.query(query, [id_usuario]);
  return result.rows[0] || null;
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getOneById,
  getByUser,
  getByUserAndDate,
  getByUserBetweenDates,
  add,
  update,
  delete: delete_,
  getHoursSummary,
  getTotalWorkedHours,
  getTodayCheckIn,
} as const;

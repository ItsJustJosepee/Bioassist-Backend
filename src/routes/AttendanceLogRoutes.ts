import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { isUUID } from '@src/common/utils/custom-validators';
import { ICoordinates } from '@src/models/AttendanceLog.model';
import AttendanceLog from '@src/models/AttendanceLog.model';
import AttendanceLogService from '@src/services/AttendanceLogService';

import { Req, Res } from './common/express-types';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const reqValidators = {
  checkIn: parseReq({
    log: (obj: unknown) => AttendanceLog.isCompleteAttendanceLog(obj),
  }),
  checkOut: parseReq({
    id_registro: isUUID,
  }),
  getByUser: parseReq({
    id_usuario: isUUID,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get attendance logs for a specific user.
 *
 * @route GET /api/attendance/logs/user/:id_usuario
 */
async function getByUser(req: Req, res: Res) {
  const { id_usuario } = reqValidators.getByUser(
    req.params as Record<string, unknown>,
  );
  const logs = await AttendanceLogService.getByUser(id_usuario);
  res.status(HttpStatusCodes.OK).json({ logs });
}

/**
 * Register a check-in (entrada).
 *
 * @route POST /api/attendance/check-in
 */
async function checkIn(req: Req, res: Res) {
  const { log } = reqValidators.checkIn(req.body);
  const newLog = await AttendanceLogService.checkIn(log);
  res.status(HttpStatusCodes.CREATED).json({ log: newLog });
}

/**
 * Register a check-out (salida).
 *
 * @route POST /api/attendance/check-out/:id_registro
 */
async function checkOut(req: Req, res: Res) {
  const { id_registro } = reqValidators.checkOut(
    req.params as Record<string, unknown>,
  );
  const coordenadas = req.body?.coordenadas_registro as
    | ICoordinates
    | undefined;
  const updatedLog = await AttendanceLogService.checkOut(id_registro, coordenadas);
  res.status(HttpStatusCodes.OK).json({ log: updatedLog });
}

/**
 * Get hours summary for a user (resumen de horas trabajadas).
 * This endpoint calculates the total hours worked by subtracting
 * hora_entrada from hora_salida for each day in the date range.
 *
 * @route GET /api/attendance/summary/:id_usuario?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
 *
 * Query parameters:
 * - fecha_inicio: ISO 8601 date (YYYY-MM-DD) - required
 * - fecha_fin: ISO 8601 date (YYYY-MM-DD) - required
 *
 * Response format:
 * {
 *   "resumen": [
 *     {
 *       "dia": "2026-01-15",
 *       "entrada": "2026-01-15T08:15:00Z",
 *       "salida": "2026-01-15T17:30:00Z",
 *       "horas_trabajadas": 9.25,
 *       "estado": "a_tiempo"
 *     }
 *   ],
 *   "total_horas": 45.5
 * }
 */
async function getSummary(req: Req, res: Res) {
  const id_usuario = req.params.id_usuario;
  
  // Validate ID
  if (!id_usuario || !isUUID(id_usuario)) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'ID de usuario inválido (debe ser UUID)' });
  }

  // Get date range from query params
  const fecha_inicio_str = req.query.fecha_inicio as string;
  const fecha_fin_str = req.query.fecha_fin as string;

  if (!fecha_inicio_str || !fecha_fin_str) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Se requieren parametros: fecha_inicio y fecha_fin (YYYY-MM-DD)' });
  }

  // Parse dates
  const fecha_inicio = new Date(fecha_inicio_str);
  const fecha_fin = new Date(fecha_fin_str);

  if (isNaN(fecha_inicio.getTime()) || isNaN(fecha_fin.getTime())) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Fechas inválidas. Formato requerido: YYYY-MM-DD' });
  }

  // Get summary with calculated hours
  const resumen = await AttendanceLogService.getHoursSummary(
    id_usuario,
    fecha_inicio,
    fecha_fin,
  );

  // Calculate total hours
  const total_horas = resumen.reduce((sum, item) => sum + item.horas_trabajadas, 0);

  res.status(HttpStatusCodes.OK).json({
    id_usuario,
    fecha_inicio: fecha_inicio_str,
    fecha_fin: fecha_fin_str,
    resumen,
    total_horas: parseFloat(total_horas.toFixed(2)),
  });
}

/**
 * Delete an attendance log.
 *
 * @route DELETE /api/attendance/logs/:id_registro
 */
async function delete_(req: Req, res: Res) {
  const id_registro = req.params.id_registro;
  if (!isUUID(id_registro)) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'ID de registro inválido' });
  }

  await AttendanceLogService.delete(id_registro);
  res.status(HttpStatusCodes.OK).end();
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  getByUser,
  checkIn,
  checkOut,
  getSummary,
  delete: delete_,
} as const;

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { IAttendanceLog, ICoordinates } from '@src/models/AttendanceLog.model';
import AttendanceLogRepo from '@src/repos/AttendanceLogRepo';
import UserRepo from '@src/repos/UserRepo';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  USER_NOT_FOUND: 'Usuario no encontrado',
  LOG_NOT_FOUND: 'Registro de asistencia no encontrado',
  INVALID_DATE_RANGE: 'El rango de fechas es inválido',
  ALREADY_CHECKED_IN: 'El usuario ya tiene un check-in registrado hoy',
  NO_CHECK_IN_TODAY: 'No hay check-in registrado para hoy',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Get all attendance logs for a specific user.
 */
async function getByUser(id_usuario: string): Promise<IAttendanceLog[]> {
  const userExists = await UserRepo.persists(id_usuario);
  if (!userExists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }

  return AttendanceLogRepo.getByUser(id_usuario);
}

/**
 * Get attendance logs for a user on a specific date.
 */
async function getByUserAndDate(
  id_usuario: string,
  fecha: Date,
): Promise<IAttendanceLog[]> {
  const userExists = await UserRepo.persists(id_usuario);
  if (!userExists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }

  return AttendanceLogRepo.getByUserAndDate(id_usuario, fecha);
}

/**
 * Create a check-in record for a user.
 * This registers the entry time and geolocation.
 */
async function checkIn(log: IAttendanceLog): Promise<IAttendanceLog> {
  const userExists = await UserRepo.persists(log.id_usuario);
  if (!userExists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }

  // Check if user already has a check-in for today
  const todayCheckIn = await AttendanceLogRepo.getTodayCheckIn(log.id_usuario);
  if (todayCheckIn && todayCheckIn.hora_entrada && !todayCheckIn.hora_salida) {
    throw new RouteError(
      HttpStatusCodes.CONFLICT,
      Errors.ALREADY_CHECKED_IN,
    );
  }

  // Set entry time to now if not provided
  log.hora_entrada = log.hora_entrada || new Date();
  log.fecha = log.fecha || new Date();

  return AttendanceLogRepo.add(log);
}

/**
 * Create a check-out record or update existing check-in.
 * This registers the exit time and calculates total hours.
 */
async function checkOut(id_registro: string, coordenadas?: ICoordinates): Promise<IAttendanceLog> {
  const log = await AttendanceLogRepo.getOneById(id_registro);
  if (!log) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOG_NOT_FOUND);
  }

  if (!log.hora_entrada) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      'No hay check-in para este registro',
    );
  }

  if (log.hora_salida) {
    throw new RouteError(
      HttpStatusCodes.CONFLICT,
      'Este registro ya tiene un check-out',
    );
  }

  // Set exit time to now if not provided
  log.hora_salida = new Date();
  if (coordenadas) {
    log.coordenadas_registro = coordenadas;
  }

  const result = await AttendanceLogRepo.update(log);
  if (!result) {
    throw new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Error al actualizar registro');
  }
  return result;
}

/**
 * Get hours summary (worked hours) for a user between two dates.
 * This is the dynamic query that calculates hours by subtracting entrada from salida.
 *
 * @param id_usuario - User ID (UUID)
 * @param fecha_inicio - Start date
 * @param fecha_fin - End date
 * @returns Array with daily entries including calculated hours
 */
async function getHoursSummary(
  id_usuario: string,
  fecha_inicio: Date,
  fecha_fin: Date,
): Promise<{
  dia: Date;
  entrada: Date | null;
  salida: Date | null;
  horas_trabajadas: number;
  estado: string;
}[]> {
  // Validate user exists
  const userExists = await UserRepo.persists(id_usuario);
  if (!userExists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }

  // Validate date range
  if (fecha_inicio > fecha_fin) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.INVALID_DATE_RANGE,
    );
  }

  // Get the raw summary with calculated hours
  const summary = await AttendanceLogRepo.getHoursSummary(
    id_usuario,
    fecha_inicio,
    fecha_fin,
  );

  // Transform to match output format
  return summary.map((item) => ({
    dia: item.fecha,
    entrada: item.hora_entrada,
    salida: item.hora_salida,
    horas_trabajadas: item.horas_trabajadas || 0,
    estado: item.estado,
  }));
}

/**
 * Get total worked hours for a user.
 * Optionally filter by date range.
 */
async function getTotalWorkedHours(
  id_usuario: string,
  fecha_inicio?: Date,
  fecha_fin?: Date,
): Promise<number> {
  const userExists = await UserRepo.persists(id_usuario);
  if (!userExists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }

  if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
    throw new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      Errors.INVALID_DATE_RANGE,
    );
  }

  return AttendanceLogRepo.getTotalWorkedHours(
    id_usuario,
    fecha_inicio,
    fecha_fin,
  );
}

/**
 * Delete an attendance log.
 */
async function delete_(id_registro: string): Promise<void> {
  const exists = await AttendanceLogRepo.getOneById(id_registro);
  if (!exists) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOG_NOT_FOUND);
  }

  await AttendanceLogRepo.delete(id_registro);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  Errors,
  getByUser,
  getByUserAndDate,
  checkIn,
  checkOut,
  getHoursSummary,
  getTotalWorkedHours,
  delete: delete_,
} as const;

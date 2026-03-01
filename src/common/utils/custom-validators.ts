/**
 * Custom validators for jet-validators library
 * Extends the built-in validators with BioAssist-specific types
 */

import { isString } from 'jet-validators';

/******************************************************************************
                            Email Validator
******************************************************************************/

/**
 * Email validation regex (simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid email
 */
export function isEmail(val: unknown): val is string {
  return isString(val) && EMAIL_REGEX.test(val);
}

/******************************************************************************
                            UUID Validator
******************************************************************************/

/**
 * UUID v4 validation regex
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
export function isUUID(val: unknown): val is string {
  return isString(val) && UUID_V4_REGEX.test(val);
}

/**
 * Validates if a string is a valid ISO 8601 date format
 */
export function isISO8601(val: unknown): val is string {
  if (!isString(val)) {
    return false;
  }
  // Basic ISO 8601 validation: YYYY-MM-DD or full datetime
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
  try {
    const date = new Date(val);
    return !isNaN(date.getTime()) && iso8601Regex.test(val);
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid time format (HH:MM:SS)
 */
export function isTimeFormat(val: unknown): val is string {
  if (!isString(val)) {
    return false;
  }
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(val);
}

/**
 * Validates one of several allowed enum values
 */
export function isOneOf<T extends readonly unknown[]>(
  ...allowedValues: T
): (val: unknown) => val is T[number] {
  return (val: unknown): val is T[number] => {
    return allowedValues.includes(val);
  };
}

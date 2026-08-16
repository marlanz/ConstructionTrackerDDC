/**
 * Shared Result<T> type and helper functions for Server Actions & API responses.
 *
 * Every Server Action MUST return a Result<T> — never throw exceptions for
 * expected failures (e.g. validation errors, unauthorized access, not found).
 */

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export const ok = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const fail = (error: string, code?: string): Result<never> => ({
  success: false,
  error,
  code,
});

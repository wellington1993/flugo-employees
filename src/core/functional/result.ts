export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export const success = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

export const failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

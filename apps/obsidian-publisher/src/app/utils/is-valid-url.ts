/**
 * Validate that the given value is a valid URL
 * @param value the value to check
 */
export const isValidUrl = (value?: unknown): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  let retVal = true;
  try {
    new URL(value);
  } catch (_) {
    retVal = false;
  }

  return retVal;
};

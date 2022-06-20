/**
 * Inspired from https://github.com/RauliL/is-valid-slug/blob/master/src/index.ts
 */
const VALID_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validate that the given value is a valid slug
 * @param value the value to check
 */
export const isValidOPublisherPostSlug = (value?: string): boolean => {
  if (!value) {
    return false;
  }

  return VALID_SLUG_PATTERN.test(value);
};

/**
 * Remove the trailing slash (if any) from the given string
 * @param value the value to strip the trailing slash from
 */
export const stripTrailingSlash = (value: string) => {
  const retVal = value.endsWith('/') ? value.slice(0, -1) : value;
  return retVal;
};

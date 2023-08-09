import {MARKDOWN_LINK_REGEX} from "../constants";

/**
 * Validate that the given value is a valid URL
 * @param value the value to check
 */
export const isMarkdownLink = (value?: unknown): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const retVal = MARKDOWN_LINK_REGEX.test(value);

  // WARNING: Since the expression is global, it must be reset as it is stateful!
  MARKDOWN_LINK_REGEX.lastIndex = 0;
  return retVal;
};

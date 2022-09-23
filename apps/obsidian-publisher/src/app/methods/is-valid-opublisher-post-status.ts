/**
 * Validate that the given value is a valid post status
 * @param value the value to check
 */
import {OPublisherPostStatus, OPublisherPostStatuses} from "../types";

export const isValidOPublisherPostStatus = (
  value: unknown
): value is OPublisherPostStatus => {
  const retVal =
    typeof value === 'string' &&
    OPublisherPostStatuses.includes(value as OPublisherPostStatus);
  return retVal;
};

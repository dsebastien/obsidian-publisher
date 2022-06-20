const OPublisherPostStatuses = ['draft', 'published', 'scheduled'] as const;
export type OPublisherPostStatus = typeof OPublisherPostStatuses[number];

/**
 * Validate that the given value is a valid post status
 * @param value the value to check
 */
export const isValidOPublisherPostStatus = (
  value: unknown
): value is OPublisherPostStatus => {
  const retVal =
    typeof value === 'string' &&
    OPublisherPostStatuses.includes(value as OPublisherPostStatus);
  return retVal;
};

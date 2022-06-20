import {
  isValidOPublisherPostStatus,
  OPublisherPostStatus,
} from './is-valid-opublisher-post-status';

describe('Is Valid OPublisher Post Status', () => {
  it('should accept valid statuses', () => {
    const validStatus1: OPublisherPostStatus = 'published';
    let result = isValidOPublisherPostStatus(validStatus1);
    expect(result).toBe(true);

    const validStatus2: OPublisherPostStatus = 'draft';
    result = isValidOPublisherPostStatus(validStatus2);
    expect(result).toBe(true);

    const validStatus3: OPublisherPostStatus = 'scheduled';
    result = isValidOPublisherPostStatus(validStatus3);
    expect(result).toBe(true);
  });

  it('should reject invalid statuses', () => {
    let result = isValidOPublisherPostStatus('foo');
    expect(result).toBe(false);

    result = isValidOPublisherPostStatus('bar');
    expect(result).toBe(false);
  });
});

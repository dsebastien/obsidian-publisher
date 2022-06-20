import { isValidOPublisherPostSlug } from './is-valid-opublisher-post-slug';

describe('Is Valid OPublisher Post Slug', () => {
  it('should accept valid slugs', () => {
    let slug = 'a';
    let result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(true);

    slug = 'ab';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(true);

    slug = 'ab-c';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(true);

    slug = 'ab-cd-ef';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(true);
  });

  it('should reject invalid slugs', () => {
    let slug = undefined;
    let result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = '';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = ' ';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = '  ';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = 'a_b';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = 'ab-c@d';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);

    slug = 'ab-cd!';
    result = isValidOPublisherPostSlug(slug);
    expect(result).toBe(false);
  });
});

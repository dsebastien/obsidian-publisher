import { isValidUrl } from './is-valid-url';

describe('Is Valid URL', () => {
  it('should accept valid URLs', () => {
    let url = 'https://google.com';
    let result = isValidUrl(url);
    expect(result).toBe(true);

    url = 'https://test.google.com';
    result = isValidUrl(url);
    expect(result).toBe(true);

    url = 'https://test.google.com/foo';
    result = isValidUrl(url);
    expect(result).toBe(true);

    url = 'https://foo.bar.baz';
    result = isValidUrl(url);
    expect(result).toBe(true);
  });

  it('should reject invalid urls', () => {
    let url = undefined;
    let result = isValidUrl(url);
    expect(result).toBe(false);

    url = '';
    result = isValidUrl(url);
    expect(result).toBe(false);

    url = ' ';
    result = isValidUrl(url);
    expect(result).toBe(false);

    url = 'foo';
    result = isValidUrl(url);
    expect(result).toBe(false);

    url = 'http://';
    result = isValidUrl(url);
    expect(result).toBe(false);

    url = 'https://';
    result = isValidUrl(url);
    expect(result).toBe(false);

    url = '@';
    result = isValidUrl(url);
    expect(result).toBe(false);
  });
});

import { stripTrailingSlash } from './strip-trailing-slash';

describe('Strip trailing slash', () => {
  it('should strip the trailing slash if present', () => {
    const text = 'https://google.be/';
    const expectedResult = 'https://google.be';
    expect(stripTrailingSlash(text)).toBe(expectedResult);
  });

  it('should return the value as is if not ending with a slash', () => {
    const text = 'https://google.be';
    expect(stripTrailingSlash(text)).toBe(text);
  });
});
